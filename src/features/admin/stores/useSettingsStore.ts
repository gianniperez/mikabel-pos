import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  transferSurcharge: number; // Porcentaje (ej: 0.1 para 10%)
  cardSurcharge: number; // Porcentaje (ej: 0.15 para 15%)
  defaultMinStock: number;
  adminPin: string;

  // Actions
  setTransferSurcharge: (value: number) => void;
  setCardSurcharge: (value: number) => void;
  setDefaultMinStock: (value: number) => void;
  setAdminPin: (pin: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      transferSurcharge: 0.1, // 10% default
      cardSurcharge: 0.15, // 15% default
      defaultMinStock: 5,
      adminPin: "1234", // Default PIN, sugerir cambio en UI

      setTransferSurcharge: (transferSurcharge) => set({ transferSurcharge }),
      setCardSurcharge: (cardSurcharge) => set({ cardSurcharge }),
      setDefaultMinStock: (defaultMinStock) => set({ defaultMinStock }),
      setAdminPin: (adminPin) => set({ adminPin }),
    }),
    {
      name: "mikabel-settings-storage",
    },
  ),
);
