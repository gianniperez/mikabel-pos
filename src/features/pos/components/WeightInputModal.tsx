import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/dialog/Modal/Modal";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input";

interface WeightInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (grams: number) => void;
  productName: string;
  initialGrams?: number;
}

export const WeightInputModal = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  initialGrams = 0,
}: WeightInputModalProps) => {
  const [grams, setGrams] = useState<string>(
    initialGrams ? initialGrams.toString() : "",
  );

  // Reset the input when the modal opens with a new initial value
  useEffect(() => {
    if (isOpen) {
      setGrams(initialGrams ? initialGrams.toString() : "");
    }
  }, [isOpen, initialGrams]);

  const handleConfirm = () => {
    const parsed = parseInt(grams, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingresar Peso"
      description={`¿Cuántos gramos de ${productName}?`}
      className="max-w-sm"
    >
      <div className="space-y-6 pt-2">
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">
            Peso en Gramos (g)
          </label>
          <div className="relative">
            <Input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: 250"
              autoFocus
              className="text-right text-2xl font-black py-4 pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
              g
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[100, 200, 250, 500].map((preset) => (
            <Button
              key={preset}
              variant="secondary"
              onClick={() => {
                setGrams(preset.toString());
              }}
              className="py-2 px-1 text-sm font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200"
            >
              {preset}g
            </Button>
          ))}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={
            !grams || isNaN(parseInt(grams, 10)) || parseInt(grams, 10) <= 0
          }
          className="w-full h-14 text-lg font-bold"
        >
          Confirmar Peso
        </Button>
      </div>
    </Modal>
  );
};
