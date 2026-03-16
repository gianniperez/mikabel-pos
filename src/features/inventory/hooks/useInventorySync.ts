"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { db as firestore } from "@/lib/firebase";
import {
  db as dexie,
  type LocalProduct,
  type LocalCategory,
} from "@/lib/dexie";
import { toast } from "sonner";

export const useInventorySync = (enabled: boolean) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => setIsSyncing(true), 0);
    console.log("Iniciando sincronización de inventario...");

    const reconcileData = async () => {
      try {
        // 1. Reconciliar Categorías
        const firestoreCats = await getDocs(collection(firestore, "categories"));
        const firestoreCatIds = new Set(firestoreCats.docs.map((doc) => doc.id));
        const localCats = await dexie.categories.toArray();
        for (const cat of localCats) {
          if (!firestoreCatIds.has(cat.id)) {
            await dexie.categories.delete(cat.id);
            console.log(`Categoría huérfana eliminada: ${cat.id}`);
          }
        }

        // 2. Reconciliar Productos
        const firestoreProds = await getDocs(collection(firestore, "products"));
        const firestoreProdIds = new Set(firestoreProds.docs.map((doc) => doc.id));
        const localProds = await dexie.products.toArray();
        for (const prod of localProds) {
          if (!firestoreProdIds.has(prod.id)) {
            await dexie.products.delete(prod.id);
            console.log(`Producto huérfano eliminado: ${prod.id}`);
          }
        }
      } catch (error) {
        console.error("Error en reconciliación de datos:", error);
      }
    };

    reconcileData();

    // 1. Suscripción a Categorías
    const qCategories = query(collection(firestore, "categories"));
    const unsubCategories = onSnapshot(
      qCategories,
      async (snapshot) => {
        try {
          for (const change of snapshot.docChanges()) {
            const categoryData = {
              id: change.doc.id,
              ...change.doc.data(),
            } as any;

            if (change.type === "added" || change.type === "modified") {
              await dexie.categories.put(categoryData);
            } else if (change.type === "removed") {
              await dexie.categories.delete(change.doc.id);
            }
          }
          console.log(
            `Categorías sincronizadas (${snapshot.docChanges().length} cambios).`,
          );
        } catch (error) {
          console.error("Error sincronizando categorías:", error);
        }
      },
      (error) => {
        console.error("Error en snapshot de categorías:", error);
        toast.error("Error al sincronizar categorías");
      },
    );

    // 2. Suscripción a Productos
    const qProducts = query(collection(firestore, "products"));
    const unsubProducts = onSnapshot(
      qProducts,
      async (snapshot) => {
        try {
          for (const change of snapshot.docChanges()) {
            const productData = {
              id: change.doc.id,
              ...change.doc.data(),
            } as any;

            if (change.type === "added" || change.type === "modified") {
              await dexie.products.put(productData);
            } else if (change.type === "removed") {
              await dexie.products.delete(change.doc.id);
            }
          }
          console.log(
            `Productos sincronizados (${snapshot.docChanges().length} cambios).`,
          );
          setLastSync(new Date());
          setIsSyncing(false);
        } catch (error) {
          console.error("Error sincronizando productos:", error);
        }
      },
      (error) => {
        console.error("Error en snapshot de productos:", error);
        toast.error("Error al sincronizar productos");
        setIsSyncing(false);
      },
    );

    return () => {
      clearTimeout(timer);
      unsubCategories();
      unsubProducts();
    };
  }, [enabled]);

  return { isSyncing, lastSync };
};
