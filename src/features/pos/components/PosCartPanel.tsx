"use client";

import { useState } from "react";
import { usePosStore } from "../stores/usePosStore";
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  BookUser,
  Tag,
  Scale,
} from "lucide-react";
import { Button } from "@/components/Button/Button";
import { CheckoutModal } from "./CheckoutModal";
import { WeightInputModal } from "./WeightInputModal";
import { useSettingsStore } from "@/features/admin/stores/useSettingsStore";
import type { CartItem } from "../stores/usePosStore";

export const PosCartPanel = () => {
  const {
    cart,
    cartSubtotal,
    cartTotal,
    surcharge,
    discount,
    paymentMethod,
    addToCart,
    updateQuantity,
    removeFromCart,
    setPaymentMethod,
    clearCart,
  } = usePosStore();

  const { transferSurcharge } = useSettingsStore();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [weightModalItem, setWeightModalItem] = useState<CartItem | null>(null);

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <div className="rounded-mikabel flex flex-col h-full bg-white shadow-lg border-l border-gray-200 w-full sm:w-96 shrink-0 relative z-10">
      {/* Cabecera del Carrito */}
      <div className="rounded-mikabel px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h2 className="text-lg font-black text-gray-800">Ticket en Curso</h2>
        {cart.length > 0 && (
          <Button
            onClick={() => clearCart()}
            variant="destructive"
            className="text-sm px-3 py-2 w-24"
          >
            Vaciar
          </Button>
        )}
      </div>

      {/* Lista de Items (Scrollable) */}
      <div className="rounded-mikabel flex-1 overflow-y-auto bg-white p-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
              <Tag className="w-6 h-6 text-gray-300" />
            </div>
            <p className="font-semibold text-sm">Escanea o tapea productos</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className={`p-3 rounded-xl border flex flex-col gap-2 transition-colors ${
                  item.isBulkPriceApplied
                    ? "border-yellow-300 bg-yellow-50/50"
                    : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                }`}
              >
                {/* Info superior del item */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate leading-tight">
                      {item.product.name}
                    </h4>
                    <h4 className="font-bold text-gray-400 text-xs truncate leading-tight">
                      {item.product.brand}
                    </h4>
                    {item.isBulkPriceApplied && (
                      <span className="text-[10px] uppercase font-black text-yellow-600 tracking-wider">
                        PRECIO MAYORISTA
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-gray-900 block leading-tight">
                      ${item.subtotal}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold block leading-tight">
                      {item.isBulkPriceApplied
                        ? `Pack x${item.product.bulkQuantity}: $${item.product.bulkPrice} | Un: $${item.product.salePrice}`
                        : `$${item.product.salePrice} ${item.product.quantityUnit === "kg" ? "/ kg" : item.product.quantityUnit === "100gr" ? "/ 100g" : "c/u"}`}
                    </span>
                  </div>
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center justify-between mt-1">
                  {item.product.quantityUnit === "kg" ||
                  item.product.quantityUnit === "100gr" ? (
                    <Button
                      onClick={() => setWeightModalItem(item)}
                      variant="outline"
                      className="border-gray-200 text-sm h-10 px-5"
                    >
                      <Scale className="w-4 h-4 text-gray-400" />
                      {item.product.quantityUnit === "kg"
                        ? `${item.quantity * 1000} g`
                        : `${item.quantity * 100} g`}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                      <Button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        variant="ghost"
                        className="w-8 h-8 p-0 flex items-center justify-center text-gray-500 hover:text-danger hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="w-10 text-center font-black text-sm text-gray-800">
                        {item.quantity}
                      </div>
                      <Button
                        onClick={() => addToCart(item.product)}
                        variant="ghost"
                        className="w-8 h-8 p-0 flex items-center justify-center text-gray-500 hover:text-success hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => removeFromCart(item.product.id)}
                    variant="ghost"
                    className="p-2 text-gray-400 hover:text-danger hover:bg-danger-light/30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer de Pagos y Totales */}
      <div className="bg-gray-50 rounded-mikabel border-t border-gray-200 flex flex-col">
        {/* Selector de Método de Pago */}
        <div className="grid grid-cols-3 gap-1 p-3">
          <button
            onClick={() => setPaymentMethod("cash")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-mikabel transition-all border-2 cursor-pointer ${
              paymentMethod === "cash"
                ? "bg-white text-success border-success/50 shadow-sm"
                : "text-gray-500 border-transparent hover:bg-gray-100"
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Efectivo</span>
          </button>

          <button
            onClick={() => setPaymentMethod("transfer")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-mikabel transition-all border-2 cursor-pointer ${
              paymentMethod === "transfer"
                ? "bg-white text-secondary border-secondary/50 shadow-sm"
                : "text-gray-500 border-transparent hover:bg-gray-100"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Transf</span>
          </button>

          <button
            onClick={() => setPaymentMethod("debt")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-mikabel transition-all border-2 cursor-pointer ${
              paymentMethod === "debt"
                ? "bg-white text-terciary border-terciary/50 shadow-sm"
                : "text-gray-500 border-transparent hover:bg-gray-100"
            }`}
          >
            <BookUser className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Fiado</span>
          </button>
        </div>

        {/* Zona de Total y Botón Cobrar */}
        <div className="p-4 pt-2 bg-white rounded-mikabel flex flex-col gap-1">
          {/* Subtotal (solo se muestra si hay recargos o descuentos para dar contexto) */}
          {(surcharge > 0 || discount > 0) && (
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
              <span>Subtotal:</span>
              <span>${cartSubtotal}</span>
            </div>
          )}

          {surcharge > 0 && (
            <div className="flex items-center justify-between text-xs font-bold text-red-500 mb-1">
              <span>Recargo (+{Math.round(transferSurcharge * 100)}%):</span>
              <span>+${surcharge}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex items-center justify-between text-xs font-bold text-green-500 mb-1">
              <span>Descuento:</span>
              <span>-${discount}</span>
            </div>
          )}

          <div className="flex items-end justify-between mt-1 mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
              Total
            </span>
            <span className="text-4xl font-black text-gray-900">
              ${cartTotal}
            </span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full h-16 text-xl shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            Cobrar (${cartTotal})
          </Button>
        </div>
      </div>

      {/* Popovers y Modales */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {weightModalItem && (
        <WeightInputModal
          isOpen={!!weightModalItem}
          onClose={() => setWeightModalItem(null)}
          productName={weightModalItem.product.name}
          initialGrams={
            weightModalItem.product.quantityUnit === "kg"
              ? weightModalItem.quantity * 1000
              : weightModalItem.quantity * 100
          }
          onConfirm={(grams) => {
            const newQuantity =
              weightModalItem.product.quantityUnit === "kg"
                ? grams / 1000
                : grams / 100;
            updateQuantity(weightModalItem.product.id, newQuantity);
          }}
        />
      )}
    </div>
  );
};
