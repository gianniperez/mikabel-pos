"use client";

import { useMemo, useState } from "react";
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
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/features/auth/stores";
import { toast } from "sonner";
import { Edit2, Package, AlertCircle, Plus, Minus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/Button";

const columnHelper = createColumnHelper<LocalProduct>();

export const InventoryTable = ({
  onEdit,
}: {
  onEdit?: (product: LocalProduct) => void;
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";

  // Suscripción reactiva a Dexie
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const handleStockChange = async (
    productId: string,
    currentStock: number,
    delta: number,
  ) => {
    if (!isAdmin) return;
    try {
      const newStock = Math.max(0, Number((currentStock + delta).toFixed(3)));
      const productRef = doc(dbFirestore, "products", productId);
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date(),
      });
      toast.success("Stock actualizado");
    } catch (error: any) {
      console.error("Error actualizando stock:", error);
      if (error.code === "not-found" || error.message?.includes("not found")) {
        toast.error(
          "El producto ya no existe en el servidor. Actualizando lista...",
        );
        await db.products.delete(productId);
      } else {
        toast.error("Error al actualizar stock");
      }
    }
  };

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c: any) => [c.id, c.name]));
  }, [categories]);

  const handleDelete = async (productId: string, productName: string) => {
    if (
      !window.confirm(`¿Estás seguro de que deseas eliminar "${productName}"?`)
    ) {
      return;
    }

    try {
      // 1. Borramos localmente para feedback instantáneo
      await db.products.delete(productId);

      // 2. Borramos en Firestore
      const productRef = doc(dbFirestore, "products", productId);
      await deleteDoc(productRef);

      toast.success("Producto eliminado");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("name", {
          header: "Producto",
          cell: (info) => (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                {categoryMap.get(info.row.original.categoryId) as string}
              </span>
              <span className="font-semibold text-gray-900 pt-2">
                {info.getValue()}
              </span>
              <span className="font-semibold text-gray-900 pb-2">
                {info.row.original.brand}
              </span>
              <span className="text-xs text-gray-500">
                Cód: {info.row.original.code}
              </span>
            </div>
          ),
        }),
        columnHelper.accessor("salePrice", {
          header: "Precio",
          cell: (info) => (
            <PriceCell
              productId={info.row.original.id}
              initialPrice={info.getValue()}
              isAdmin={isAdmin}
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
                  {isAdmin && (
                    <button
                      onClick={() =>
                        handleStockChange(info.row.original.id, stock, -step)
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
                  {isAdmin && (
                    <button
                      onClick={() =>
                        handleStockChange(info.row.original.id, stock, step)
                      }
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
                  handleDelete(info.row.original.id, info.row.original.name)
                }
                className="cursor-pointer p-2 text-gray-400 hover:text-danger transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ),
        }),
      ].filter((col) => isAdmin || col.id !== "actions"),
    [categoryMap, onEdit, isAdmin],
  );

  const table = useReactTable({
    data: products,
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
      {/* Search Bar */}
      <SearchBar
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Buscar por código, nombre, marca o categoría..."
      />

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

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            "px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1",
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

                  {/* Bottom Row: Price, Hovering Actions */}
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-gray-900 text-lg">
                      ${product.salePrice}
                    </span>

                    {isAdmin && (
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
                          onClick={() => handleDelete(product.id, product.name)}
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
    </div>
  );
};

// --- Componentes Auxiliares ---

const PriceCell = ({
  productId,
  initialPrice,
  isAdmin,
}: {
  productId: string;
  initialPrice: number;
  isAdmin: boolean;
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
        salePrice: newPrice,
        updatedAt: new Date(),
      });
      toast.success("Precio actualizado");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error actualizando precio:", error);

      if (error.code === "not-found" || error.message?.includes("not found")) {
        toast.error("El producto ya no existe. Actualizando...");
        await db.products.delete(productId);
      } else {
        toast.error("Error al actualizar precio");
        setValue(initialPrice.toString());
      }
      setIsEditing(false);
    }
  };

  if (!isAdmin) {
    return (
      <span className="font-bold text-gray-900">
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
          className="w-24 px-2 py-1 text-sm font-bold border-2 border-primary rounded-lg focus:outline-none"
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
      className="group flex items-center gap-2 font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer"
      title="Click para editar precio"
    >
      <span>${(initialPrice || 0).toLocaleString()}</span>
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
