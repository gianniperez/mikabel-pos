"use client";

import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary" | "warning";
  isLoading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  isLoading = false,
}: ConfirmModalProps) => {
  const isDestructive = variant === "destructive";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className="max-w-sm"
    >
      <div className="space-y-6 pt-4">
        <div
          className={`p-4 rounded-mikabel flex gap-3 ${
            isDestructive
              ? "bg-danger/10 border border-danger/30"
              : "bg-secondary/10 border border-primary/30"
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 ${
              isDestructive ? "text-danger" : "text-primary"
            }`}
          />
          <p
            className={`text-sm font-medium leading-tight ${
              isDestructive ? "text-danger" : "text-primary"
            }`}
          >
            {isDestructive
              ? "Esta acción no se puede deshacer. Por favor, asegúrate antes de continuar."
              : "Por favor, confirma que deseas realizar esta acción."}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "warning" ? "primary" : variant} // Map warning to primary if Button doesn't have warning
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
