import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CashSession } from "../types/cashSession";

type CashSessionState = {
  activeSession: CashSession | null;
  isOpen: boolean;
  
  // Actions
  setSession: (session: CashSession) => void;
  updateSession: (updates: Partial<CashSession>) => void;
  clearSession: () => void;
};

export const useCashSessionStore = create<CashSessionState>()(
  persist(
    (set) => ({
      activeSession: null,
      isOpen: false,

      setSession: (session) => set({ activeSession: session, isOpen: true }),
      updateSession: (updates) =>
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, ...updates }
            : null,
        })),
      clearSession: () => set({ activeSession: null, isOpen: false }),
    }),
    {
      name: "mikabel-cash-session",
    }
  )
);
