"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, limit, QueryDocumentSnapshot, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { PendingTicket } from "../stores/usePosStore";
import { useCallback, useRef } from "react";

export const useSessionTickets = () => {
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDoc = useRef<QueryDocumentSnapshot | null>(null);
  const { activeSession } = useCashSessionStore();

  const fetchSessionTickets = useCallback(async (isLoadMore = false) => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      let q = query(
        collection(db, "sales"),
        where("sessionId", "==", activeSession.id),
        orderBy("createdAt", "desc"),
        limit(10),
      );

      if (isLoadMore && lastDoc.current) {
        q = query(q, startAfter(lastDoc.current));
      }

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PendingTicket[];
      
      if (isLoadMore) {
        setTickets(prev => [...prev, ...data]);
      } else {
        setTickets(data);
      }
      
      lastDoc.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === 10); 
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchSessionTickets();
  }, [fetchSessionTickets]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchSessionTickets(true);
    }
  };

  return { tickets, isLoading, hasMore, refetch: fetchSessionTickets, loadMore };
};
