import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { editCustomer, deleteCustomer } from "../api/debtsDb";
import { Customer } from "../types/debt";
import { useAuthStore } from "@/features/auth/stores";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const EditCustomerModal = ({
  isOpen,
  onClose,
  customer,
}: EditCustomerModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { dbUser } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setName(customer?.name || "");
        setPhone(customer?.phone || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [customer, isOpen]);

  const editMutation = useMutation({
    mutationFn: ({ name, phone }: { name: string; phone: string }) =>
      editCustomer(customer!.id, name, phone),
    onSuccess: () => {
      toast.success("Cliente actualizado");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
    onError: (error) => {
      console.error("Error al editar cliente:", error);
      toast.error("Error al actualizar el cliente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customer!.id),
    onSuccess: () => {
      toast.success("Cliente eliminado");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
    onError: (error) => {
      console.error("Error al eliminar cliente:", error);
      toast.error("Error al eliminar el cliente");
    },
  });

  const handleEdit = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    // Duplicate check
    const existingCustomers =
      queryClient.getQueryData<Customer[]>(["customers"]) || [];
    const exists = existingCustomers.some(
      (c) =>
        c.id !== customer?.id &&
        c.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (exists) {
      toast.error("Ya existe otro cliente con ese nombre");
      return;
    }

    editMutation.mutate({ name: trimmedName, phone: phone.trim() });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsConfirmDeleteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEdit();
    }
  };

  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() =>
        !editMutation.isPending && !deleteMutation.isPending && onClose()
      }
      title="Editar Cliente"
      description="Modifica el nombre o apodo del cliente."
      className="max-w-sm"
    >
      <div className="space-y-6 pt-4">
        <Input
          label="Nombre o Apodo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={editMutation.isPending}
        />

        <Input
          label="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={editMutation.isPending}
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={editMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleEdit}
            disabled={
              !name.trim() ||
              (name === customer.name && phone === customer.phone) ||
              editMutation.isPending
            }
          >
            {editMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar permanentemente a ${customer.name}?`}
        confirmText="Sí, Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </Modal>
  );
};
