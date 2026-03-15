import { LocalProduct } from "@/lib/dexie";

export type StockAdjustmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: LocalProduct | null;
  initialDelta: number;
};
