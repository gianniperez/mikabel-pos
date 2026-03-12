import { useState, useRef, useEffect } from "react";
import { Modal } from "./dialog/Modal/Modal";
import { Button } from "../Button/Button";
import { useSettingsStore } from "@/features/admin/stores/useSettingsStore";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface AuthPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export const AuthPinModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Autorización de Administrador",
}: AuthPinModalProps) => {
  const [pin, setPin] = useState("");
  const storedPin = useSettingsStore((state) => state.adminPin);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setPin(""), 0);
      // Dar foco al input invisible para capturar teclado
      const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => {
        clearTimeout(timer);
        clearTimeout(focusTimer);
      };
    }
  }, [isOpen]);

  const handleCharClick = (char: string) => {
    if (pin.length < 4) {
      const newPin = pin + char;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyPin = (pinToVerify: string) => {
    if (pinToVerify === storedPin) {
      toast.success("Acceso autorizado");
      onSuccess();
      onClose();
    } else {
      toast.error("PIN incorrecto");
      setPin("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "0" && e.key <= "9") {
      handleCharClick(e.key);
    } else if (e.key === "Backspace") {
      handleBackspace();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Ingresa el PIN de seguridad de 4 dígitos"
    >
      <div className="flex flex-col items-center space-y-8 py-4">
        <div className="bg-primary-light/20 p-4 rounded-full">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        {/* Visualización del PIN (Dots) */}
        <div className="flex space-x-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i
                  ? "bg-primary border-primary scale-125"
                  : "bg-transparent border-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Input invisible para recolectar input de teclado físico */}
        <input
          ref={inputRef}
          type="tel"
          className="absolute opacity-0 pointer-events-none"
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {/* Teclado Numérico Visual (Touch Friendly) */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleCharClick(num)}
              className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-black text-gray-800 transition-colors"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleCharClick("0")}
            className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-black text-gray-800 transition-colors"
          >
            0
          </button>
          <Button onClick={handleBackspace} variant="destructive" className="">
            Borrar
          </Button>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </Modal>
  );
};
