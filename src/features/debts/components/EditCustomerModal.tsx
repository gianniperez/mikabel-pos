import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/dialog/Modal/Modal";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { editCustomer, deleteCustomer } from "../api/debtsDb";
import { Customer } from "../types/debt";
import { AlertTriangle, Trash2 } from "lucide-react";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setName(customer?.name || "");
        setPhone(customer?.phone || "");
        setIsDeleting(false);
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
    if (customer?.totalDebt && customer.totalDebt > 0) {
      toast.error(
        "No puedes eliminar un cliente con deuda activa. Debe saldarla primero.",
      );
      setIsDeleting(false);
      return;
    }
    deleteMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isDeleting) {
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
      title={isDeleting ? "Eliminar Cliente" : "Editar Cliente"}
      description={
        isDeleting
          ? `¿Estás seguro de que deseas eliminar permanentemente a ${customer.name}?`
          : "Modifica el nombre o apodo del cliente."
      }
      className="max-w-sm"
    >
      <div className="space-y-6 pt-4">
        {!isDeleting ? (
          <>
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

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Eliminar cliente"
              >
                <Trash2 className="w-5 h-5" />
              </button>

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
          </>
        ) : (
          <div className="space-y-4">
            {customer.totalDebt > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  <strong>¡Atención!</strong> Este cliente tiene una deuda
                  activa de <strong>${customer.totalDebt}</strong>. No puede ser
                  eliminado hasta que la salde.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsDeleting(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending || customer.totalDebt > 0}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Sí, Eliminar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
