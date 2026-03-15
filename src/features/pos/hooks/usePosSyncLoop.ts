"use client";

import { useEffect, useRef } from "react";
import { usePosStore } from "../stores/usePosStore";
import { db } from "@/lib/firebase";
import {
  writeBatch,
  doc,
  collection,
  increment,
  getDoc,
} from "firebase/firestore";
import { toast } from "sonner";

export const usePosSyncLoop = () => {
  const syncQueue = usePosStore((state) => state.syncQueue);
  const removeTicketFromQueue = usePosStore(
    (state) => state.removeTicketFromQueue,
  );
  const isSyncing = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      // 1. Evitar ejecuciones simultáneas o si no hay internet o no hay nada que subir
      if (isSyncing.current || syncQueue.length === 0 || !navigator.onLine)
        return;

      isSyncing.current = true;

      for (const ticket of syncQueue) {
        try {
          // A. VERIFICAR IDEMPOTENCIA (Si el ticket ya existe en Firebase, lo salteamos)
          const saleRef = doc(db, "sales", ticket.id);
          const saleSnap = await getDoc(saleRef);

          if (!saleSnap.exists()) {
            const batch = writeBatch(db);

            // 1. Crear documento de Venta
            batch.set(saleRef, {
              ...ticket,
              createdAt: new Date(ticket.timestamp),
            });

            // 2. Restar Stock Atómicamente
            ticket.items.forEach(
              (item: { product: { id: string }; quantity: number }) => {
                const productRef = doc(db, "products", item.product.id);
                batch.set(
                  productRef,
                  {
                    stock: increment(-item.quantity),
                  },
                  { merge: true },
                );
              },
            );

            // 3. Incrementar Contadores del Turno
            const sessionRef = doc(db, "cash_sessions", ticket.sessionId);
            const updateData: Record<string, unknown> = {
              totalMovements: increment(1),
            };

            if (ticket.splitPayments) {
              // Lógica de Pago Mixto
              if (ticket.splitPayments.cash > 0) {
                updateData.totalCashSales = increment(
                  ticket.splitPayments.cash,
                );
              }
              if (ticket.splitPayments.transfer > 0) {
                updateData.totalTransferSales = increment(
                  ticket.splitPayments.transfer,
                );
              }
              if (ticket.splitPayments.card && ticket.splitPayments.card > 0) {
                updateData.totalCardSales = increment(
                  ticket.splitPayments.card,
                );
              }
              if (ticket.splitPayments.debt && ticket.splitPayments.debt > 0) {
                updateData.totalDebtSales = increment(
                  ticket.splitPayments.debt,
                );
                // Manejo de deuda en pago mixto (similar al caso 'debt' puro)
                if (ticket.customerId) {
                  const newDebtRef = doc(collection(db, "debts"));
                  batch.set(newDebtRef, {
                    customerId: ticket.customerId,
                    saleId: ticket.id,
                    amount: ticket.splitPayments.debt,
                    paidAmount: 0,
                    status: "pending",
                    employeeId: ticket.employeeId || "unknown",
                    createdAt: new Date(ticket.timestamp),
                    paidAt: null,
                  });

                  const customerRef = doc(db, "customers", ticket.customerId);
                  batch.set(
                    customerRef,
                    {
                      totalDebt: increment(ticket.splitPayments.debt),
                    },
                    { merge: true },
                  );
                }
              }
            } else {
              // Lógica de Pago Simple (Retrocompatibilidad y casos normales)
              if (ticket.paymentMethod === "cash") {
                updateData.totalCashSales = increment(ticket.total);
              } else if (ticket.paymentMethod === "transfer") {
                updateData.totalTransferSales = increment(ticket.total);
              } else if (ticket.paymentMethod === "card") {
                updateData.totalCardSales = increment(ticket.total);
              } else if (ticket.paymentMethod === "debt") {
                updateData.totalDebtSales = increment(ticket.total);

                if (ticket.customerId) {
                  const newDebtRef = doc(collection(db, "debts"));
                  batch.set(newDebtRef, {
                    customerId: ticket.customerId,
                    saleId: ticket.id,
                    amount: ticket.total,
                    paidAmount: 0,
                    status: "pending",
                    employeeId: ticket.employeeId || "unknown",
                    createdAt: new Date(ticket.timestamp),
                    paidAt: null,
                  });

                  const customerRef = doc(db, "customers", ticket.customerId);
                  batch.set(
                    customerRef,
                    {
                      totalDebt: increment(ticket.total),
                    },
                    { merge: true },
                  );
                }
              }
            }

            batch.set(sessionRef, updateData, { merge: true });

            // 4. Ejecutar Batch en Firebase
            await batch.commit();
            console.log(
              `[SyncLoop] Ticket ${ticket.id} sincronizado exitosamente.`,
            );
          } else {
            console.warn(
              `[SyncLoop] Ticket ${ticket.id} ya existía en Firebase. Limpiando cola local.`,
            );
          }

          // B. Sacar de la cola (tanto si lo acabamos de subir como si ya existía)
          removeTicketFromQueue(ticket.id);
        } catch (error) {
          console.error(
            `[SyncLoop] Falló la sincronización del ticket ${ticket.id}. Se reintentará luego.`,
            error,
          );
          break;
        }
      }

      isSyncing.current = false;
    };

    // Intentar sincronizar cada 15 segundos si hay elementos
    const intervalId = setInterval(processQueue, 15000);

    // Intentar inmediatamente si detectamos que volvió el internet
    window.addEventListener("online", processQueue);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", processQueue);
    };
  }, [syncQueue, removeTicketFromQueue]);
};

// Proveedor utilitario para inyectar este hook en un Server Component (ej: layout.tsx)
export const PosSyncProvider = () => {
  usePosSyncLoop();
  return null;
};
