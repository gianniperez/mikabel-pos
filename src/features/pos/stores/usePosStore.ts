import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LocalProduct } from "@/lib/dexie";
import { db as dexieDb } from "@/lib/dexie";
import { useSettingsStore } from "../../admin/stores/useSettingsStore";

// Tipos para el POS Backend-less (Zero Latency)
export type PaymentMethod = "cash" | "transfer" | "card" | "debt";

export interface CartItem {
  product: LocalProduct;
  quantity: number;
  subtotal: number;
  // Indicador de si el sistema aplicó automáticamente el precio mayorista (bulk)
  isBulkPriceApplied: boolean;
}

export interface PendingTicket {
  id: string; // ID temporal
  items: CartItem[];
  subtotal: number; // Suma pura de items
  discount: number; // Monto descontado
  surcharge: number; // Monto recargado (ej. +10% por tarjeta)
  total: number; // Total final (subtotal - discount + surcharge)
  paymentMethod: PaymentMethod;
  splitPayments?: {
    cash: number;
    transfer: number;
    card?: number;
    debt?: number; // Opcional por si en el futuro se quiere Fiado + Otro
  };
  timestamp: number;
  sessionId: string; // ID del turno en el que se vendió
  employeeId: string; // Autor de la venta
  createdAt?: { toDate: () => Date }; // Para compatibilidad con Firestore en la visualización
  status: "pending" | "failed" | "completed" | "cancelled"; // Para la cola de resincronización y visualización
  customerId?: string; // Necesario para asociar ventas por Fiado
}

interface PosState {
  // Carrito Actual
  cart: CartItem[];
  paymentMethod: PaymentMethod;

  // Modificadores Financieros (Valores absolutos $)
  discount: number;
  surcharge: number;

  // Totales Derivados
  cartSubtotal: number; // Suma pura de items
  cartTotal: number; // Subtotal + Surcharge - Discount

  // Cola Optimista (Zero-Latency)
  syncQueue: PendingTicket[];

  // Mutaciones del Carrito
  addToCart: (product: LocalProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscount: (discount: number) => void;
  setSurcharge: (surcharge: number) => void;
  clearCart: () => void;

  // Mutaciones de la Cola
  enqueueTicket: (ticket: PendingTicket) => void;
  removeTicketFromQueue: (ticketId: string) => void;

  // Mutación de Stock en Dexie (Local)
  updateLocalStock: (items: CartItem[]) => Promise<void>;
}

// Función pura de ayuda para recalcular el subtotal considerando el Bulk Price (Precio Mayorista)
const calculateItemSubtotal = (
  product: LocalProduct,
  quantity: number,
): { subtotal: number; isBulkPriceApplied: boolean } => {
  let isBulkPriceApplied = false;
  let subtotal = product.salePrice * quantity;

  // Verificar si aplica la regla de bulto (bulkQuantity > 0 y la cantidad llevada es mayor o igual)
  if (
    product.bulkQuantity !== null &&
    product.bulkQuantity > 0 &&
    product.bulkPrice !== null &&
    quantity >= product.bulkQuantity
  ) {
    isBulkPriceApplied = true;
    const bulkCount = Math.floor(quantity / product.bulkQuantity);
    const remainder = quantity % product.bulkQuantity;
    // El 'bulkPrice' es el precio total del pack entero (ej: 3 por $6000), no el precio unitario.
    subtotal = bulkCount * product.bulkPrice + remainder * product.salePrice;
  }

  return {
    subtotal,
    isBulkPriceApplied,
  };
};

const calculateCartTotals = (
  cart: CartItem[],
  method: PaymentMethod,
  discount: number,
) => {
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Usar el valor dinámico de la store de settings
  const settings = useSettingsStore.getState();
  let surchargeRate = 0;
  if (method === "transfer") surchargeRate = settings.transferSurcharge;
  if (method === "card") surchargeRate = settings.cardSurcharge;

  const surcharge = subtotal * surchargeRate;
  const total = Math.max(0, subtotal + surcharge - discount);

  return {
    cartSubtotal: subtotal,
    surcharge,
    cartTotal: total,
  };
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      paymentMethod: "cash",
      discount: 0,
      surcharge: 0,
      cartSubtotal: 0,
      cartTotal: 0,
      syncQueue: [],

      // Acciones del Carrito
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.cart.findIndex(
            (item) => item.product.id === product.id,
          );

          const newCart = [...state.cart];

          if (existingItemIndex >= 0) {
            // El producto ya está, aumentamos su cantidad
            const item = newCart[existingItemIndex];
            const newQuantity = item.quantity + quantity;
            const { subtotal, isBulkPriceApplied } = calculateItemSubtotal(
              item.product,
              newQuantity,
            );

            newCart[existingItemIndex] = {
              ...item,
              quantity: newQuantity,
              subtotal,
              isBulkPriceApplied,
            };
          } else {
            // Producto nuevo en el carrito
            const { subtotal, isBulkPriceApplied } = calculateItemSubtotal(
              product,
              quantity,
            );
            newCart.push({
              product,
              quantity,
              subtotal,
              isBulkPriceApplied,
            });
          }

          const totals = calculateCartTotals(
            newCart,
            state.paymentMethod,
            state.discount,
          );

          return {
            cart: newCart,
            ...totals,
          };
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newCart = state.cart.filter(
            (item) => item.product.id !== productId,
          );
          const totals = calculateCartTotals(
            newCart,
            state.paymentMethod,
            state.discount,
          );

          return {
            cart: newCart,
            ...totals,
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newCart = state.cart.filter(
              (item) => item.product.id !== productId,
            );
            const totals = calculateCartTotals(
              newCart,
              state.paymentMethod,
              state.discount,
            );
            return { cart: newCart, ...totals };
          }

          const newCart = state.cart.map((item) => {
            if (item.product.id === productId) {
              const { subtotal, isBulkPriceApplied } = calculateItemSubtotal(
                item.product,
                quantity,
              );
              return { ...item, quantity, subtotal, isBulkPriceApplied };
            }
            return item;
          });

          const totals = calculateCartTotals(
            newCart,
            state.paymentMethod,
            state.discount,
          );
          return { cart: newCart, ...totals };
        });
      },

      setPaymentMethod: (method) => {
        set((state) => {
          const totals = calculateCartTotals(
            state.cart,
            method,
            state.discount,
          );
          return { paymentMethod: method, ...totals };
        });
      },

      setDiscount: (discount) => {
        set((state) => {
          const totals = calculateCartTotals(
            state.cart,
            state.paymentMethod,
            discount,
          );
          return { discount, ...totals };
        });
      },

      setSurcharge: (surcharge) => {
        set((state) => {
          // El Admin puede forzar un Surcharge manual extra si hiciera falta.
          // Aquí actualizamos el subtotal para que se sume encima del 10% si se da el caso.
          const rawTotal = state.cartSubtotal;
          return {
            surcharge,
            cartTotal: Math.max(0, rawTotal + surcharge - state.discount),
          };
        });
      },

      clearCart: () => {
        set({
          cart: [],
          cartSubtotal: 0,
          cartTotal: 0,
          discount: 0,
          surcharge: 0,
          paymentMethod: "cash",
        });
      },

      // Acciones de la Cola Optimista
      enqueueTicket: (ticket) => {
        set((state) => ({
          syncQueue: [...state.syncQueue, ticket],
        }));
      },

      removeTicketFromQueue: (ticketId) => {
        set((state) => ({
          syncQueue: state.syncQueue.filter((t) => t.id !== ticketId),
        }));
      },

      updateLocalStock: async (items) => {
        try {
          await dexieDb.transaction("rw", dexieDb.products, async () => {
            for (const item of items) {
              const current = await dexieDb.products.get(item.product.id);
              if (current) {
                await dexieDb.products.update(item.product.id, {
                  stock: current.stock - item.quantity,
                });
              }
            }
          });
          console.log("[Dexie] Stock actualizado localmente con éxito.");
        } catch (error) {
          console.error("[Dexie] Error al actualizar stock local:", error);
        }
      },
    }),
    {
      name: "mikabel-pos-storage", // Nombre key en localStorage
      // Escogemos persistir SOLO la cola (para recovery) y el carrito (por si f5tea sin querer)
      partialize: (state) => ({
        cart: state.cart,
        cartSubtotal: state.cartSubtotal,
        cartTotal: state.cartTotal,
        discount: state.discount,
        surcharge: state.surcharge,
        syncQueue: state.syncQueue,
      }),
    },
  ),
);
