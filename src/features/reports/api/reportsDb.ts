import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { CashSession } from "@/features/pos/types/cashSession";
import { Product } from "@/types/models";
import { subDays, startOfDay } from "date-fns";

export const getCashSessionsHistory = async (
  limitCount: number = 20,
  startDate?: Date,
): Promise<CashSession[]> => {
  try {
    let q = query(collection(db, "cash_sessions"), orderBy("openedAt", "desc"));

    if (startDate) {
      q = query(q, where("openedAt", ">=", Timestamp.fromDate(startDate)));
    } else {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        openedAt: data.openedAt?.toMillis?.() || data.openedAt || Date.now(),
        closedAt: data.closedAt?.toMillis?.() || data.closedAt || null,
      } as CashSession;
    });
  } catch (error) {
    console.error("Error fetching cash sessions history:", error);
    throw error;
  }
};

export const getTopSellingProducts = async (
  days: number = 30,
): Promise<{ name: string; brand?: string; count: number }[]> => {
  try {
    const startDate = startOfDay(subDays(new Date(), days));

    // 1. Traer ventas recientes por fecha (más simple para evitar requerir índices compuestos)
    const q = query(
      collection(db, "sales"),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
    );

    const snapshot = await getDocs(q);
    const productMap: Record<
      string,
      { name: string; brand?: string; count: number }
    > = {};

    // 2. Agregar cantidades
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "cancelled") return; // Saltamos ventas anuladas en cliente

      const items = data.items || [];

      items.forEach(
        (item: {
          product: { id: string; name: string; brand?: string };
          quantity: number;
        }) => {
          const productId = item.product.id;
          const productName = item.product.name;
          const productBrand = item.product.brand;
          // Para productos por peso, item.quantity son unidades/kg.
          // Sumamos la cantidad para saber volumen total.
          const qty = Number(item.quantity) || 0;

          if (!productMap[productId]) {
            productMap[productId] = {
              name: productName,
              brand: productBrand,
              count: 0,
            };
          }
          productMap[productId].count += qty;
        },
      );
    });

    // 3. Convertir a array, ordenar y limitar a top 5
    return Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error("Error calculating top selling products:", error);
    return [];
  }
};

export const getLowStockProducts = async (
  limitCount: number = 10,
): Promise<Product[]> => {
  try {
    // Nota: Firestore no permite `where("stock", "<=", "minStock")` compando 2 campos.
    // Solo se puede buscar por valores fijos.
    // Como workaround de MVP: Traemos todo ordenado por stock asc y filtramos en cliente
    // Opcional: Si el catálogo es inmenso (miles), esto es ineficiente.
    // Pero para < 1000 items, hacer un getDocs de `products` es viable.

    const q = query(
      collection(db, "products"),
      // Asumiremos que si un producto tiene stock menor a 10 es "crítico".
      // Firestore no puede comparar propiedades dinámicas nativamente.
      where("stock", "<=", 5),
      orderBy("stock", "asc"),
      limit(limitCount),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data } as Product;
    });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw error;
  }
};
