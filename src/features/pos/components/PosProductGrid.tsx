"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalProduct, type LocalCategory } from "@/lib/dexie";
import { usePosStore } from "../stores/usePosStore";
import { SearchBar } from "@/components/SearchBar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Plus } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";

export const PosProductGrid = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const addToCart = usePosStore((state) => state.addToCart);

  // Obtener categorías para los filtros
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  // Obtener productos, filtrando por categoría y término de búsqueda
  const products = useLiveQuery(async () => {
    let collection = db.products.toCollection();

    if (selectedCategoryId) {
      collection = db.products.where("categoryId").equals(selectedCategoryId);
    }

    const results = await collection.toArray();

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      return results.filter((p: LocalProduct) => {
        const catName = p.categoryId
          ? categories.find((c: LocalCategory) => c.id === p.categoryId)
              ?.name || ""
          : "";
        const brandName = p.brand || "";

        return (
          p.name.toLowerCase().includes(lowerTerm) ||
          p.code.toLowerCase().includes(lowerTerm) ||
          brandName.toLowerCase().includes(lowerTerm) ||
          catName.toLowerCase().includes(lowerTerm)
        );
      });
    }
    return results;
  }, [selectedCategoryId, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white rounded-mikabel shadow-sm border border-gray-200 overflow-hidden">
      {/* Header / Buscador / Categorías */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <SearchBar
          placeholder="Buscar por código, nombre, marca o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Filtro por Categorías Horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <Button
            onClick={() => setSelectedCategoryId(null)}
            variant={selectedCategoryId === null ? "primary" : "outline"}
            rounded="full"
            className="rounded-full whitespace-nowrap py-2 text-sm transition-colors w-24"
          >
            Todos
          </Button>
          {[...categories]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((cat: LocalCategory) => (
              <div key={cat.id}>
                <Button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  variant={
                    selectedCategoryId === cat.id ? "primary" : "outline"
                  }
                  rounded="full"
                  className="rounded-full whitespace-nowrap py-2 text-sm transition-colors w-24"
                >
                  {cat.name}
                </Button>
              </div>
            ))}
        </div>
      </div>

      {/* Grilla de Pad de Productos */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {!products ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400 font-semibold">
            No hay productos
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {products.map((product: LocalProduct) => (
              <Card
                key={product.id}
                variant="interactive"
                padding="none"
                onClick={() => addToCart(product, 1)}
                className="relative flex flex-col p-2 text-center group hover:bg-secondary hover:border-secondary transition-all duration-200"
              >
                {/* Plus Icon on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content wrapper for blurring or fading */}
                <div className="w-full h-full flex flex-col items-center group-hover:opacity-20 transition-opacity duration-200">
                  {/* Indicador Bulk */}
                  {product.bulkQuantity && product.bulkPrice && (
                    <span className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg rounded-tr-xl z-30">
                      MAYOR
                    </span>
                  )}

                  {/* Imagen del Producto */}
                  <div className="w-full h-24 mb-2 overflow-hidden rounded-lg relative">
                    <ProductImage
                      src={product.photoUrl}
                      alt={product.name}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="w-full text-center">
                    <span className="text-[10px] font-bold text-gray-400 block truncate">
                      {product.code}
                    </span>

                    <h3 className="text-xs font-bold text-gray-800 leading-tight line-clamp-1 mb-0.5">
                      {product.name}
                    </h3>
                    <h3 className="text-xs font-bold text-gray-500 leading-tight line-clamp-1 mb-1">
                      {product.brand}
                    </h3>

                    <div className="mt-1">
                      <span className="text-base font-black text-primary group-hover:text-white transition-colors">
                        ${product.salePrice}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
