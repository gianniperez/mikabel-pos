import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, writeBatch, increment, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";

export const useCancelSale = () => {
  const [isCancelling, setIsCancelling] = useState(false);
  const { dbUser, firebaseUser } = useAuthStore();

  const cancelSale = async (ticketId: string) => {
    // 1. Verificación de permisos ruda
    if (dbUser?.role !== "admin") {
      toast.error("Solo los Administradores pueden anular comprobantes.");
      return false;
    }

    setIsCancelling(true);
    try {
      // 2. Traer el comprobante real para saber qué revertir
      const saleRef = doc(db, "sales", ticketId);
      const saleSnap = await getDoc(saleRef);

      if (!saleSnap.exists()) {
        toast.error("El ticket no existe o ya fue eliminado");
        return false;
      }

      const saleData = saleSnap.data();

      // Ya está anulado?
      if (saleData.status === "cancelled") {
        toast.info("Este ticket ya se encontraba anulado");
        return false;
      }

      const batch = writeBatch(db);

      // 3. Marcar el Ticket como Anulado (Mantenemos registro contable)
      batch.update(saleRef, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: firebaseUser?.uid || "admin_unknown",
      });

      // 4. Devolver stock de los Items vendidos al Inventario
      if (Array.isArray(saleData.items)) {
        saleData.items.forEach((item: any) => {
          const productRef = doc(db, "products", item.product.id);
          batch.update(productRef, {
            // El item guardaba quantity. Era una venta, así que restó.
            // Para anular, incrementemos `quantity` nuevamente.
            stock: increment(item.quantity)
          });
        });
      }

      // 5. Descontar el dinero de la Caja (Si correspondía a la sesión activa)
      // Como un Admin puede anular tickets viejos, hay que restar de la sesión histórica exacta.
      if (saleData.sessionId) {
         const sessionRef = doc(db, "cash_sessions", saleData.sessionId);
         const sessionUpdateData: any = {
           totalMovements: increment(-1) // Restamos un movimiento porque la venta se deshizo
         };

         // Restamos el dinero que había sumado según el método de pago original
         if (saleData.paymentMethod === "cash") {
           sessionUpdateData.totalCashSales = increment(-saleData.total);
         } else if (saleData.paymentMethod === "transfer") {
           sessionUpdateData.totalTransferSales = increment(-saleData.total);
         } else if (saleData.paymentMethod === "debt") {
           sessionUpdateData.totalDebtSales = increment(-saleData.total);
         }

         batch.update(sessionRef, sessionUpdateData);
      }

      // 6. Eliminar la deuda si la venta fue fiada
      if (saleData.paymentMethod === "debt" && saleData.customerId) {
        const debtsQuery = query(
          collection(db, "debts"),
          where("saleId", "==", ticketId)
        );
        const debtsSnap = await getDocs(debtsQuery);
        
        let totalDebtToSubtract = 0;
        debtsSnap.docs.forEach((debtDoc) => {
          const debtData = debtDoc.data();
          // Restar de la master account del cliente solo lo que NO había pagado aún
          const remainingDebt = (debtData.amount || 0) - (debtData.paidAmount || 0);
          totalDebtToSubtract += remainingDebt;
          
          // Eliminar el documento de deuda
          batch.delete(debtDoc.ref);
        });

        if (totalDebtToSubtract > 0) {
          const customerRef = doc(db, "customers", saleData.customerId);
          batch.update(customerRef, {
            totalDebt: increment(-totalDebtToSubtract)
          });
        }
      }

      // 7. Ejecutar el Batch Reversivo
      await batch.commit();
      
      toast.success(`Venta ${ticketId.substring(0,8)} anulada con éxito`);
      return true;

    } catch (error) {
      console.error("Error al anular venta:", error);
      toast.error("Ocurrió un error crítico al intentar anular el ticket.");
      return false;
    } finally {
      setIsCancelling(false);
    }
  };

  return { cancelSale, isCancelling };
};
