import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";
import { User as DbUser } from "@/types/models";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  setAuth: (firebaseUser: FirebaseUser | null, dbUser: DbUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  dbUser: null,
  loading: true,
  setAuth: (firebaseUser, dbUser) =>
    set({ firebaseUser, dbUser, loading: false }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () => set({ firebaseUser: null, dbUser: null, loading: false }),
}));
