"use client";

import { useState } from "react";
import { Plus, Package, RefreshCw } from "lucide-react";
import { InventoryTable, ProductForm } from "@/features/inventory/components";
import { Modal } from "@/components/ui/dialog/Modal/Modal";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { usePageMetadata } from "@/hooks/usePageMetadata";

export default function InventoryPage() {
  usePageMetadata({
    title: "Inventario",
    description: "Gestión de catálogo, stock y precios de productos",
  });
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const productsCount = useLiveQuery(() => db.products.count()) || 0;

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <PageHeader
        title="Inventario"
        description={`${productsCount} productos registrados en el sistema`}
        onReload={() => toast.info("Sincronización en curso...")}
        actionButton={
          isAdmin ? (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              variant="primary"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Producto</span>
            </Button>
          ) : undefined
        }
      />

      {/* Main Table Section */}
      <InventoryTable onEdit={handleEdit} />

      {/* New/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
        description={
          editingProduct
            ? "Modifica los datos del producto seleccionado."
            : "Completa la información para dar de alta un producto en el catálogo."
        }
        className="max-w-2xl"
      >
        <ProductForm
          initialData={editingProduct}
          categories={categories}
          onSuccess={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
