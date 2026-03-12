"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";

export const useSessionTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeSession } = useCashSessionStore();

  const fetchSessionTickets = async () => {
    if (!activeSession) return;
    
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "sales"),
        where("sessionId", "==", activeSession.id),
        orderBy("createdAt", "desc")
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionTickets();
  }, [activeSession?.id]);

  return { tickets, isLoading, refetch: fetchSessionTickets };
};
