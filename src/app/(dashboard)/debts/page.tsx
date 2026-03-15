"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/features/debts/api/debtsDb";
import { Customer } from "@/features/debts/types/debt";
import { Card } from "@/components/Card";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Edit2, Trash2, UserRound, Plus, Phone } from "lucide-react";
import { deleteCustomer } from "@/features/debts/api/debtsDb";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DebtsListPanel } from "@/features/debts/components/DebtsListPanel";
import { AddCustomerModal } from "@/features/debts/components/AddCustomerModal";
import { EditCustomerModal } from "@/features/debts/components/EditCustomerModal";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/features/auth/stores";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function DebtsPage() {
  usePageMetadata({
    title: "Fiados",
    description: "Seguimiento de deudas de clientes y libreta barrial",
  });

  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      toast.success("Cliente eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      console.error("Error al eliminar cliente:", error);
      toast.error("Error al eliminar el cliente");
    },
  });

  const handleDelete = () => {
    if (!customerToDelete) return;
    deleteMutate(customerToDelete.id);
    setCustomerToDelete(null);
  };

  const confirmDelete = (id: string, name: string) => {
    setCustomerToDelete({ id, name });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.totalDebt > 0,
  );

  const displayCustomers = filteredCustomers
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.totalDebt - a.totalDebt);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes"
        description="Gestión de cuentas corrientes y fiados"
        actionButton={
          <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
            <Plus className="w-5 h-5" />
            <span>Nuevo Cliente</span>
          </Button>
        }
      />
      <div
        className={`flex-1 flex flex-col ${selectedCustomer ? "hidden md:flex" : "flex"}`}
      >
        <SearchBar
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="mb-6"
        />

        <div className="flex-1 overflow-y-auto space-y-3 pb-20">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400">
              Cargando clientes...
            </div>
          ) : displayCustomers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No se encontraron clientes.
            </div>
          ) : (
            displayCustomers.map((customer) => (
              <Card
                key={customer.id}
                padding="none"
                onClick={() => setSelectedCustomer(customer)}
                className="md:m-3 hover:bg-primary-light/10 hover:scale-[1.02] min-h-[140px] cursor-pointer p-5 flex items-center justify-between transition-all group relative"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-5 flex-1">
                  <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-primary shrink-0 shadow-sm border border-blue-100">
                    <UserRound className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {customer.name}
                    </h3>
                    <p className="text-sm font-semibold text-gray-500">
                      {customer.totalDebt > 0 ? "Deuda Activa" : "Al día"}
                    </p>
                    <div className="flex items-center font-bold gap-2 text-gray-500 text-sm">
                      <Phone className="h-4 w-4" />
                      {customer.phone ? (
                        <span>+54 9 {customer.phone}</span>
                      ) : (
                        <span className="text-gray-400">No registrado</span>
                      )}
                    </div>
                    <div className="pt-2">
                      <span
                        className={`text-2xl font-black ${customer.totalDebt > 0 ? "text-danger" : "text-success"}`}
                      >
                        ${customer.totalDebt.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}

                <div className="flex flex-col items-end justify-between h-full min-h-[100px] ml-4">
                  <p className="cursor-pointer text-sm font-bold text-primary group-hover:text-primary-dark flex items-center gap-1 transition-all">
                    Ver Detalles
                  </p>
                  {(isAdmin || dbUser?.permissions?.delete_customer) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToEdit(customer);
                          setIsEditModalOpen(true);
                        }}
                        className="cursor-pointer p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(customer.id, customer.name);
                        }}
                        className="cursor-pointer p-2 text-gray-400 hover:text-danger transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Panel Lateral - Detalle del Cliente */}
      {selectedCustomer && (
        <DebtsListPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Modal Alta de Cliente */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Modal Edición de Cliente */}
      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCustomerToEdit(null);
        }}
        customer={customerToEdit}
      />

      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar permanentemente a ${customerToDelete?.name}?`}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
}
