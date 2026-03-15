import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { StockMovement } from "@/types/models";

export const logStockMovement = async (
  movement: Omit<StockMovement, "id" | "createdAt">,
) => {
  const productRef = doc(db, "products", movement.productId);
  const movementsRef = collection(db, "stock_movements");
  const newMovementRef = doc(movementsRef);

  await runTransaction(db, async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists()) {
      throw new Error("El producto no existe");
    }

    const currentStock = productDoc.data().stock || 0;
    const newStock = Math.max(0, Number((currentStock + movement.quantity).toFixed(3)));

    // 1. Actualizar el stock del producto
    transaction.update(productRef, {
      stock: newStock,
      updatedAt: serverTimestamp(),
    });

    // 2. Crear el registro del movimiento (Limpiamos undefined para Firestore)
    const cleanedMovement = Object.fromEntries(
      Object.entries(movement).filter(([_, v]) => v !== undefined),
    );

    transaction.set(newMovementRef, {
      ...cleanedMovement,
      createdAt: serverTimestamp(),
    });
  });
};
