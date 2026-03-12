import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { createCustomer, editCustomer } from "../api/debtsDb";
import { Customer } from "../types/debt";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const AddCustomerModal = ({
  isOpen,
  onClose,
  customer,
}: AddCustomerModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setName(customer?.name || "");
        setPhone(customer?.phone || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [customer, isOpen]);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      if (isEditing && customer) {
        await editCustomer(customer.id, name, phone);
      } else {
        await createCustomer(name, phone);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Cliente actualizado correctamente"
          : "Cliente agregado correctamente",
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setName("");
      setPhone("");
      onClose();
    },
    onError: (error) => {
      console.error("Error al guardar cliente:", error);
      toast.error("Hubo un error al guardar el cliente.");
    },
  });

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    const existingCustomers =
      queryClient.getQueryData<Customer[]>(["customers"]) || [];
    const exists = existingCustomers.some(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== customer?.id,
    );

    if (exists) {
      toast.error("Ya existe un cliente con ese nombre");
      return;
    }
    
    mutate({ name: trimmedName, phone: phone.trim() });
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
      onClose={() => !isPending && onClose()}
      title={isEditing ? "Editar Cliente" : "Cliente"}
      description={
        isEditing
          ? "Modifica el nombre o apodo del cliente."
          : "Crea un nuevo cliente para poder anotarle fiados."
      }
      className="max-w-sm"
    >
      <div className="space-y-6 pt-4">
        <Input
          label="Nombre o Apodo"
          placeholder="Ej: Juan Pérez"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isPending}
          required={true}
        />

        <Input
          label="Teléfono (Opcional)"
          placeholder="Ej: 11 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
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
            {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
