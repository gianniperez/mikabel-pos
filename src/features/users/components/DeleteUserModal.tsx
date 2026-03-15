"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { User } from "@/types/models";
import { AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteUserModal = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  isDeleting,
}: Props) => {
  const [confirmText, setConfirmText] = useState("");

  if (!user) return null;

  const handleConfirm = () => {
    if (confirmText === "CONFIRMAR") {
      onConfirm();
      onClose();
      setConfirmText("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Usuario"
      description={`¿Estás seguro de que deseas eliminar permanentemente a ${user.name}?`}
      className="max-w-sm"
    >
      <div className="space-y-6 pt-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-mikabel flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-medium leading-tight">
            Esta acción no se puede deshacer. Se borrarán todos los datos del
            perfil del usuario.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
            Escribe <span className="text-red-600">CONFIRMAR</span> para
            continuar
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="CONFIRMAR"
            className="text-center font-black uppercase tracking-widest"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            disabled={confirmText !== "CONFIRMAR"}
            isLoading={isDeleting}
          >
            Sí, Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
