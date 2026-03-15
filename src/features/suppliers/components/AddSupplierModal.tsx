"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { createSupplier, updateSupplier } from "../api/suppliersDb";
import { Supplier } from "../types/supplier";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export const AddSupplierModal = ({
  isOpen,
  onClose,
  supplier,
}: AddSupplierModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const queryClient = useQueryClient();
  const isEditing = !!supplier;

  useEffect(() => {
    if (isOpen) {
      setName(supplier?.name || "");
      setPhone(supplier?.phone || "");
      setContactName(supplier?.contactName || "");
    }
  }, [supplier, isOpen]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      contactName: string;
    }) => {
      // Validar duplicados (case-insensitive)
      const suppliers = queryClient.getQueryData<Supplier[]>(["suppliers"]) || [];
      const isDuplicate = suppliers.some(
        (s) =>
          s.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
          (!isEditing || s.id !== supplier?.id),
      );

      if (isDuplicate) {
        throw new Error("Ya existe un proveedor con ese nombre");
      }

      if (isEditing && supplier) {
        await updateSupplier(supplier.id, data);
      } else {
        await createSupplier(data.name, data.phone, data.contactName);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Proveedor actualizado correctamente"
          : "Proveedor agregado correctamente",
      );
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Error al guardar proveedor:", error);
      toast.error(error.message || "Hubo un error al guardar el proveedor.");
    },
  });

  const handleConfirm = () => {
    if (name.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }
    mutate({
      name: name.trim(),
      phone: phone.trim(),
      contactName: contactName.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isPending && onClose()}
      title={isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
      description={
        isEditing
          ? "Edita la información del proveedor."
          : "Agrega un nuevo proveedor."
      }
      className="max-w-md"
    >
      <div className="space-y-6 pt-4">
        <Input
          label="Nombre de la Empresa / Proveedor"
          placeholder="Ej: Distribuidora Sol"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          disabled={isPending}
          required
        />

        <Input
          label="Nombre de Contacto (Opcional)"
          placeholder="Ej: Juan de Distribuidora"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          disabled={isPending}
        />

        <Input
          label="Teléfono (Opcional)"
          placeholder="Ej: 11 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isPending}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!name.trim() || isPending}
          >
            {isPending ? "Guardando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
