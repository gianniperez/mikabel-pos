"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, writeBatch, increment, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores";

export const useCancelSale = () => {
  const [isCancelling, setIsCancelling] = useState(false);
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";

  const cancelSale = async (saleId: string) => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden anular ventas");
      return false;
    }

    setIsCancelling(true);
    try {
      const saleRef = doc(db, "sales", saleId);
      const saleSnap = await getDoc(saleRef);

      if (!saleSnap.exists()) {
        toast.error("No se encontró la venta");
        return false;
      }

      const saleData = saleSnap.data();

      // 1. Validar que no esté ya anulada
      if (saleData.status === "cancelled") {
        toast.error("Esta venta ya fue anulada");
        return false;
      }

      const batch = writeBatch(db);

      // 2. Marcar Venta como Anulada
      batch.update(saleRef, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: dbUser?.uid,
      });

      // 3. Devolver Stock
      if (saleData.items && Array.isArray(saleData.items)) {
        saleData.items.forEach(
          (item: { product: { id: string }; quantity: number }) => {
            const productRef = doc(db, "products", item.product.id);
            batch.update(productRef, {
              // El item guardaba quantity. Era una venta, así que restó.
              // Para anular, incrementemos `quantity` nuevamente.
              stock: increment(item.quantity),
            });
          },
        );
      }

      // 5. Descontar el dinero de la Caja (Si correspondía a la sesión activa)
      // Como un Admin puede anular tickets viejos, hay que restar de la sesión histórica exacta.
      if (saleData.sessionId) {
        const sessionRef = doc(db, "cash_sessions", saleData.sessionId);
        const sessionUpdateData: Record<string, unknown> = {
          totalMovements: increment(-1), // Restamos un movimiento porque la venta se deshizo
        };

        // Restamos el dinero que había sumado según el método de pago original
        if (saleData.paymentMethod === "cash") {
          sessionUpdateData.totalCashSales = increment(-saleData.total);
        } else if (saleData.paymentMethod === "transfer") {
          sessionUpdateData.totalTransferSales = increment(-saleData.total);
        } else if (saleData.paymentMethod === "split") {
          if (saleData.splitPayments?.cash) {
            sessionUpdateData.totalCashSales = increment(
              -saleData.splitPayments.cash,
            );
          }
          if (saleData.splitPayments?.transfer) {
            sessionUpdateData.totalTransferSales = increment(
              -saleData.splitPayments.transfer,
            );
          }
        }

        batch.set(sessionRef, sessionUpdateData, { merge: true });
      }

      // 6. Si era una venta a DEUDA (fiado), restar de la deuda del cliente
      if (saleData.paymentMethod === "debt" && saleData.customerId) {
        const customerRef = doc(db, "customers", saleData.customerId);
        batch.update(customerRef, {
          balance: increment(-saleData.total),
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      toast.success("Venta anulada correctamente. Stock y caja actualizados.");
      return true;
    } catch (error) {
      console.error("Error al anular venta:", error);
      toast.error("Error al anular la venta");
      return false;
    } finally {
      setIsCancelling(false);
    }
  };

  return { cancelSale, isCancelling };
};
