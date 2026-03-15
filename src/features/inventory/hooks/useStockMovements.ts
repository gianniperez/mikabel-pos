import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import { StockMovement } from "@/types/models";

export const useStockMovements = (maxMovements: number = 50) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    // Solo mostramos pérdidas, consumos y correcciones (filtramos restock y sale)
    const q = query(
      collection(db, "stock_movements"),
      where("reason", "in", ["loss", "consumption", "correction"]),
      orderBy("createdAt", "desc"),
      limit(maxMovements),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const movementData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          } as StockMovement;
        });
        setMovements(movementData);
        setIsLoading(false);
        setIsIndexing(false);
      },
      (error: any) => {
        console.error("Error fetching stock movements:", error);
        if (error.code === "failed-precondition" || error.message?.includes("index")) {
          setIsIndexing(true);
        }
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [maxMovements]);

  return { movements, isLoading, isIndexing };
};
