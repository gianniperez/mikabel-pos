"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { PendingTicket } from "../stores/usePosStore";
import { useCallback } from "react";

export const useSessionTickets = () => {
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeSession } = useCashSessionStore();

  const fetchSessionTickets = useCallback(async () => {
    if (!activeSession) return;
    
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "sales"),
        where("sessionId", "==", activeSession.id),
        orderBy("createdAt", "desc")
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PendingTicket[];
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchSessionTickets();
  }, [fetchSessionTickets]);

  return { tickets, isLoading, refetch: fetchSessionTickets };
};
