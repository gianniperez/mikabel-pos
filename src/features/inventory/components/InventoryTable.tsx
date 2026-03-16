"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalProduct } from "@/lib/dexie";
import { db as dbFirestore } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuthStore } from "@/features/auth/stores";
import { toast } from "sonner";
import { Edit2, Package, AlertCircle, Plus, Minus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { logStockMovement } from "../api/stockMovements";
import { ProductImage } from "@/components/ProductImage";

const columnHelper = createColumnHelper<LocalProduct>();

export const InventoryTable = ({
  onEdit,
}: {
  onEdit?: (product: LocalProduct) => void;
}) => {
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [adjustmentState, setAdjustmentState] = useState<{
    isOpen: boolean;
    product: LocalProduct | null;
    delta: number;
  }>({
    isOpen: false,
    product: null,
    delta: 0,
  });

  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";
  const canEditStock = !!(isAdmin || dbUser?.permissions?.edit_stock);
  const canEditPrices = !!(isAdmin || dbUser?.permissions?.edit_prices);
  const canEditProduct = !!(isAdmin || dbUser?.permissions?.edit_product);

  // Suscripción reactiva a Dexie
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const handleStockChange = useCallback(
    async (product: LocalProduct, delta: number) => {
      if (!canEditStock) return;

      // Si es una suma (Entrada de mercadería), lo hacemos directo sin modal
      if (delta > 0) {
        try {
          await logStockMovement({
            productId: product.id,
            quantity: delta,
            reason: "restock",
            employeeId: dbUser?.uid || "unknown",
          });
          toast.success("Stock aumentado correctamente");
        } catch (error) {
          console.error("Error updating stock directly:", error);
          toast.error("Error al actualizar el stock");
        }
        return;
      }

      // Si es una resta (Pérdida/Ajuste), abrimos el modal
      setAdjustmentState({
        isOpen: true,
        product,
        delta,
      });
    },
    [canEditStock, dbUser?.uid],
  );
  const categoryMap = useMemo(() => {
    return new Map(
      categories.map((c: { id: string; name: string }) => [c.id, c.name]),
    );
  }, [categories]);

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      // 1. Borramos localmente para feedback instantáneo
      await db.products.delete(productToDelete.id);

      // 2. Borramos en Firestore
      const productRef = doc(dbFirestore, "products", productToDelete.id);
      await deleteDoc(productRef);

      toast.success("Producto eliminado");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error("Error al eliminar el producto");
    } finally {
      setProductToDelete(null);
    }
  };

  const confirmDelete = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
  };

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("name", {
          header: "Producto",
          cell: (info) => (
            <div className="flex items-center gap-4">
              <ProductImage
                src={info.row.original.photoUrl}
                alt={info.row.original.name}
                className="w-12 h-12 rounded-xl shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">
                  {categoryMap.get(info.row.original.categoryId) as string}
                </span>
                <EditableNameCell
                  productId={info.row.original.id}
                  initialName={info.getValue()}
                  canEdit={isAdmin}
                />
                <span className="text-xs font-semibold text-gray-700">
                  {info.row.original.brand}
                </span>
                <span className="text-xs text-gray-500">
                  Cód: {info.row.original.code}
                </span>
              </div>
            </div>
          ),
        }),
        columnHelper.accessor("costPrice", {
          id: "costPrice",
          header: "Costo",
          cell: (info) => (
            <EditablePriceCell
              productId={info.row.original.id}
              initialPrice={info.getValue()}
              canEdit={isAdmin}
              field="costPrice"
            />
          ),
        }),
        columnHelper.accessor("salePrice", {
          id: "salePrice",
          header: "Venta",
          cell: (info) => (
            <EditablePriceCell
              productId={info.row.original.id}
              initialPrice={info.getValue()}
              canEdit={canEditPrices}
              field="salePrice"
            />
          ),
        }),
        columnHelper.accessor("stock", {
          header: "Stock",
          cell: (info) => {
            const stock = info.getValue();
            const minStock = info.row.original.minStock;
            const unit = info.row.original.quantityUnit;
            const isLow = stock <= minStock;
            const isCritical = stock <= 0;

            // Definir el salto del botón: 1 para unidades, 0.1 (100g) para kg
            const step = unit === "kg" ? 0.1 : 1;

            return (
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg p-1 border-gray-200 border-2">
                  {canEditStock && (
                    <button
                      onClick={() =>
                        handleStockChange(info.row.original, -step)
                      }
                      className="cursor-pointer p-1 hover:bg-gray-50 hover:text-danger rounded transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-baseline gap-1 px-2 min-w-16 justify-center">
                    <span
                      className={clsx(
                        "font-bold text-sm",
                        isCritical
                          ? "text-danger"
                          : isLow
                            ? "text-danger"
                            : "text-success",
                      )}
                    >
                      {stock}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {unit === "unit" ? "un" : unit}
                    </span>
                  </div>
                  {canEditStock && (
                    <button
                      onClick={() => handleStockChange(info.row.original, step)}
                      className="cursor-pointer p-1 hover:bg-gray-50 hover:text-success rounded transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isLow && <AlertCircle className="w-4 h-4 text-danger" />}
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "Acciones",
          cell: (info) => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit?.(info.row.original)}
                className="cursor-pointer p-2 text-gray-400 hover:text-primary transition-colors"
                title="Editar"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  confirmDelete(info.row.original.id, info.row.original.name)
                }
                className="cursor-pointer p-2 text-gray-400 hover:text-danger transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ),
        }),
      ].filter((col) => {
        const column = col as { id?: string };
        return (
          isAdmin ||
          (column.id !== "actions" && column.id !== "costPrice") ||
          (column.id === "actions" && canEditProduct)
        );
      }),
    [
      categoryMap,
      onEdit,
      isAdmin,
      canEditStock,
      canEditPrices,
      canEditProduct,
      handleStockChange,
    ],
  );

  const filteredProducts = useMemo(() => {
    if (!showLowStockOnly) return products;
    return products.filter((p: LocalProduct) => p.stock <= p.minStock);
  }, [products, showLowStockOnly]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const lowerFilter = filterValue.toLowerCase();
      const product = row.original;
      const catName = (categoryMap.get(product.categoryId) as string) || "";
      const brandName = product.brand || "";

      return (
        product.name.toLowerCase().includes(lowerFilter) ||
        product.code.toLowerCase().includes(lowerFilter) ||
        brandName.toLowerCase().includes(lowerFilter) ||
        catName.toLowerCase().includes(lowerFilter)
      );
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Bar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchBar
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por código, nombre, marca o categoría..."
          />
        </div>
        <Button
          variant={showLowStockOnly ? "destructive" : "outline"}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={cn(
            "w-full md:w-auto h-12 py-0 shrink-0",
            showLowStockOnly ? "shadow-inner border-danger" : "",
          )}
        >
          <AlertCircle className="w-5 h-5" />
          Stock Crítico
        </Button>
      </div>

      {/* Table & Cards Container */}
      <div className="md:bg-white md:border md:border-gray-100 md:rounded-2xl md:shadow-sm overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              const product = row.original;
              const unit = product.quantityUnit;
              const isLow = product.stock <= product.minStock;
              const isCritical = product.stock <= 0;
              const step = unit === "kg" ? 0.1 : 1;
              const catName = categoryMap.get(product.categoryId) as string;

              return (
                <div
                  key={row.id}
                  className="p-4 flex flex-col gap-3 relative bg-white border border-gray-100 rounded-mikabel shadow-sm"
                >
                  {/* Top Row: Category, Stock Pill, Unit */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <ProductImage
                        src={product.photoUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-xl shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500">
                          {catName}
                        </span>
                        <span className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
                          {product.name}
                        </span>
                        {product.brand && (
                          <span className="font-semibold text-gray-700 text-sm">
                            {product.brand}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-500 mt-1">
                          Cód: {product.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            "min-w-20 justify-center px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                            isCritical
                              ? "bg-danger/10 text-danger"
                              : isLow
                                ? "bg-danger/10 text-danger"
                                : "bg-success/10 text-success",
                          )}
                        >
                          Stock: {product.stock}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold mr-1">
                        {unit === "unit" ? "Unidad" : unit}
                      </span>
                    </div>
                  </div>

                  {/* Stock Controls for Mobile */}
                  {canEditStock && (
                    <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-500 ml-2">
                        Ajustar Stock
                      </span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleStockChange(product, -step)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-danger active:scale-95 transition-transform"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="font-black text-primary text-lg min-w-8 text-center">
                          {product.stock}
                        </span>
                        <button
                          onClick={() => handleStockChange(product, step)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-success active:scale-95 transition-transform"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Row: Price, Hovering Actions */}
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Precio Venta
                      </span>
                      <EditablePriceCell
                        productId={product.id}
                        initialPrice={product.salePrice}
                        canEdit={canEditPrices}
                        field="salePrice"
                        mobile
                      />
                    </div>

                    {canEditProduct && (
                      <div className="flex items-center">
                        <Button
                          onClick={() => onEdit?.(product)}
                          variant="ghost"
                          className="w-10 h-10 p-0 text-gray-400 hover:text-primary hover:bg-gray-50"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() =>
                            confirmDelete(product.id, product.name)
                          }
                          variant="ghost"
                          className="w-10 h-10 p-0 text-gray-400 hover:text-danger hover:bg-gray-50 flex items-center justify-center"
                          title="Eliminar"
                        >
                          <Trash2 className=" w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <Package className="w-12 h-12 opacity-20" />
                <p className="font-medium">No se encontraron productos</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="bg-gray-100 hidden md:block overflow-x-auto p-4">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-primary-light/5 transition-colors cursor-default"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap bg-white border-y border-gray-100 first:border-l first:rounded-l-lg last:border-r last:rounded-r-lg shadow-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 opacity-20" />
                      <p className="font-medium">No se encontraron productos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {table.getRowModel().rows.length} de {products.length}{" "}
            productos
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              className="px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Anterior
            </Button>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              variant="outline"
              className="px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <StockAdjustmentModal
        isOpen={adjustmentState.isOpen}
        onClose={() =>
          setAdjustmentState((prev) => ({ ...prev, isOpen: false }))
        }
        product={adjustmentState.product}
        initialDelta={adjustmentState.delta}
      />

      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        description={`¿Estás seguro de que deseas eliminar permanentemente "${productToDelete?.name}"?`}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};

// --- Componentes Auxiliares ---

const EditablePriceCell = ({
  productId,
  initialPrice,
  canEdit,
  field = "salePrice",
  mobile = false,
}: {
  productId: string;
  initialPrice: number;
  canEdit: boolean;
  field?: "salePrice" | "costPrice";
  mobile?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState((initialPrice || 0).toString());

  const handleUpdate = async () => {
    const newPrice = parseFloat(value);
    if (isNaN(newPrice) || newPrice <= 0) {
      setValue(initialPrice.toString());
      setIsEditing(false);
      return;
    }

    if (newPrice === initialPrice) {
      setIsEditing(false);
      return;
    }

    try {
      const productRef = doc(dbFirestore, "products", productId);
      await updateDoc(productRef, {
        [field]: newPrice,
        updatedAt: new Date(),
      });
      toast.success(
        field === "salePrice" ? "Precio actualizado" : "Costo actualizado",
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando precio:", error);
      const fbError = error as { code?: string; message?: string };

      if (
        fbError.code === "not-found" ||
        fbError.message?.includes("not found")
      ) {
        toast.error("El producto ya no existe. Actualizando...");
        await db.products.delete(productId);
      } else {
        toast.error("Error al actualizar precio");
        setValue(initialPrice.toString());
      }
      setIsEditing(false);
    }
  };

  if (!canEdit) {
    return (
      <span
        className={clsx(
          "font-bold text-gray-900",
          mobile ? "text-lg" : "text-base",
        )}
      >
        ${(initialPrice || 0).toLocaleString()}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-bold">$</span>
        <input
          autoFocus
          type="number"
          className={clsx(
            "px-2 py-1 font-bold border-2 border-primary rounded-lg focus:outline-none",
            mobile ? "w-32 text-lg" : "w-24 text-sm",
          )}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleUpdate}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUpdate();
            if (e.key === "Escape") {
              setValue(initialPrice.toString());
              setIsEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={clsx(
        "group flex items-center gap-2 font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer",
        mobile ? "text-lg" : "text-base",
      )}
      title={
        field === "salePrice"
          ? "Click para editar precio"
          : "Click para editar costo"
      }
    >
      <span>${(initialPrice || 0).toLocaleString()}</span>
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

// --- Edición inline de nombre (solo admin) ---

const EditableNameCell = ({
  productId,
  initialName,
  canEdit,
}: {
  productId: string;
  initialName: string;
  canEdit: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialName);

  const handleUpdate = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(initialName);
      setIsEditing(false);
      return;
    }

    if (trimmed === initialName) {
      setIsEditing(false);
      return;
    }

    try {
      const productRef = doc(dbFirestore, "products", productId);
      await updateDoc(productRef, {
        name: trimmed,
        updatedAt: new Date(),
      });
      toast.success("Nombre actualizado");
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando nombre:", error);
      const fbError = error as { code?: string; message?: string };
      if (
        fbError.code === "not-found" ||
        fbError.message?.includes("not found")
      ) {
        toast.error("El producto ya no existe.");
        await db.products.delete(productId);
      } else {
        toast.error("Error al actualizar nombre");
        setValue(initialName);
      }
      setIsEditing(false);
    }
  };

  if (!canEdit) {
    return (
      <span className="font-semibold text-gray-900 pt-1">{initialName}</span>
    );
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        className="mt-1 px-2 py-0.5 font-semibold text-gray-900 border-2 border-primary rounded-lg focus:outline-none text-sm w-48"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleUpdate}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleUpdate();
          if (e.key === "Escape") {
            setValue(initialName);
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-1 font-semibold text-gray-900 hover:text-primary transition-colors cursor-pointer pt-1 text-left"
      title="Click para editar nombre"
    >
      <span>{initialName}</span>
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
};
