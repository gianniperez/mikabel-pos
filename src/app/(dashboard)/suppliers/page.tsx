"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  getSuppliers,
  deleteSupplier,
  type Supplier,
} from "@/features/suppliers/api/suppliersDb";
import { Card } from "@/components/Card";
import {
  Edit2,
  Truck,
  Plus,
  Phone,
  UserCircle,
  Trash2,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { AddSupplierModal } from "@/features/suppliers/components/AddSupplierModal";
import { RegisterSupplierPaymentModal } from "@/features/suppliers/components/RegisterSupplierPaymentModal";
import { SupplierMovementsPanel } from "@/features/suppliers/components/SupplierMovementsPanel";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useAuthStore } from "@/features/auth/stores";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function SuppliersPage() {
  usePageMetadata({
    title: "Proveedores",
    description: "Gestión de distribuidores y pagos realizados",
  });

  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";
  const canViewSuppliers = isAdmin || dbUser?.permissions?.view_suppliers;

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<any>(null);
  const [initialSupplierForPayment, setInitialSupplierForPayment] =
    useState<string>("");

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );

  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const { mutate: removeSupplier, isPending: isDeleting } = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success("Proveedor eliminado");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setSupplierToDelete(null);
    },
    onError: (error) => {
      console.error("Error al eliminar proveedor:", error);
      toast.error("No se pudo eliminar el proveedor");
    },
  });

  const handleDelete = () => {
    if (supplierToDelete) {
      removeSupplier(supplierToDelete.id);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactName &&
        s.contactName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (!canViewSuppliers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-4 text-center">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-100">
          <Truck className="h-10 w-10 opacity-20" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-500 max-w-sm font-bold">
          No tenés los permisos necesarios para gestionar proveedores. 
          Contactá con un administrador si creés que esto es un error.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Proveedores"
        description="Seguimiento de compras y pagos a distribuidores."
        actionButton={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setInitialSupplierForPayment("");
                setIsPaymentModalOpen(true);
              }}
              variant="secondary"
            >
              <DollarSign className="w-5 h-5" />
              <span className="hidden sm:inline">Registrar Pago</span>
              <span className="sm:hidden">Pagar</span>
            </Button>
            <Button
              onClick={() => {
                setSupplierToEdit(null);
                setIsModalOpen(true);
              }}
              variant="primary"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Proveedor</span>
            </Button>
          </div>
        }
      />

      <SearchBar
        placeholder="Buscar proveedor o contacto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        containerClassName="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-10 text-gray-400">
            Cargando proveedores...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-400">
            No se encontraron proveedores.
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card
              key={supplier.id}
              onClick={() => setSelectedSupplier(supplier)}
              className="hover:bg-primary-light/10 hover:shadow-md hover:scale-[1.02] min-h-[140px] cursor-pointer p-5 flex items-center justify-between transition-all group relative"
            >
              <div className="flex items-center gap-5 flex-1">
                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-primary shrink-0 shadow-sm border border-blue-100">
                  <Truck className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {supplier.name}
                  </h3>
                  <p
                    className={`text-sm font-semibold ${supplier.totalPending > 0 ? "text-danger" : "text-success"}`}
                  >
                    {supplier.totalPending > 0
                      ? `Debe $${supplier.totalPending.toLocaleString("es-AR")}`
                      : "Al día"}
                  </p>
                  <div className="flex items-center font-bold gap-2 text-gray-500 text-sm">
                    <UserCircle className="h-4 w-4" />
                    {supplier.contactName ? (
                      <span>{supplier.contactName}</span>
                    ) : (
                      <span className="text-gray-400">Sin contacto</span>
                    )}
                  </div>

                  <div className="flex items-center font-bold gap-2 text-gray-500 text-sm">
                    <Phone className="h-4 w-4" />
                    {supplier.phone ? (
                      <span>+54 9 {supplier.phone}</span>
                    ) : (
                      <span className="text-gray-400">No registrado</span>
                    )}
                  </div>
                  <div className="pt-2 flex flex-col">
                    <span className="text-xs uppercase font-bold text-gray-500 mb-2">
                      Total Pagado
                    </span>
                    <span className="text-2xl font-black text-gray-900 leading-none">
                      ${(supplier.totalPaid || 0).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-full min-h-[100px] ml-4">
                <p className="cursor-pointer text-sm font-bold text-primary group-hover:text-primary-dark flex items-center gap-1 transition-all">
                  Ver Detalles
                </p>
                {(isAdmin || dbUser?.permissions?.delete_customer) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSupplierToEdit(supplier);
                        setIsModalOpen(true);
                      }}
                      className="cursor-pointer p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSupplierToDelete(supplier);
                      }}
                      disabled={isDeleting}
                      className="cursor-pointer p-2 text-gray-400 hover:text-danger transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      {isDeleting && supplierToDelete?.id === supplier.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSupplierToEdit(null);
        }}
        supplier={supplierToEdit}
      />
      <RegisterSupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setInitialSupplierForPayment("");
        }}
        suppliers={suppliers}
        initialSupplierId={initialSupplierForPayment}
      />
      {selectedSupplier && (
        <SupplierMovementsPanel
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Proveedor"
        description={`¿Estás seguro de que deseas eliminar permanentemente a "${supplierToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}
