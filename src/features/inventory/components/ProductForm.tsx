"use client";

import { useState } from "react";

// @ts-ignore - Lint false positive in this environment
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db as firestore } from "@/lib/firebase";
import { db as dexie } from "@/lib/dexie";
import { toast } from "sonner";
import { type LocalProduct } from "@/lib/dexie";
import { clsx } from "clsx";
import { Plus, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? null : val),
  z.coerce.number().nullable(),
);

const productSchema = z.object({
  code: z.string().min(1, "Este campo es obligatorio"),
  name: z.string().min(1, "Este campo es obligatorio"),
  brand: z.string().optional(),
  categoryId: z.string().min(1, "Este campo es obligatorio"),
  salePrice: z.coerce
    .number({
      message: "Este campo es obligatorio",
    })
    .gt(0, "El precio debe ser mayor a 0"),
  costPrice: optionalNumber,
  bulkPrice: optionalNumber,
  bulkQuantity: optionalNumber,
  quantityUnit: z.enum(["kg", "unit", "100gr"]),
  stock: z.coerce
    .number({
      message: "Este campo es obligatorio",
    })
    .min(0, "El stock no puede ser negativo"),
  minStock: optionalNumber,
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: LocalProduct | null;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
}

export const ProductForm = ({
  initialData,
  onSuccess,
  categories,
}: ProductFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          brand: initialData.brand || "",
        }
      : {
          code: "",
          name: "",
          brand: "",
          salePrice: 0,
          costPrice: 0,
          bulkPrice: null,
          bulkQuantity: null,
          quantityUnit: "unit",
          stock: 0,
          minStock: 3,
          categoryId: "",
        },
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Helper para entrada de stock en gramos
  const [stockInputMode, setStockInputMode] = useState<"base" | "grams">(
    "base",
  );
  const quantityUnit = watch("quantityUnit");
  const isWeightBased = quantityUnit === "kg" || quantityUnit === "100gr";

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Validar si la categoría ya existe
    const exists = categories.some(
      (cat) =>
        cat.name.trim().toLowerCase() === newCategoryName.trim().toLowerCase(),
    );

    if (exists) {
      toast.error("La categoría ya existe");
      return;
    }

    setIsCreatingCategory(true);
    try {
      const categoryRef = doc(collection(firestore, "categories"));
      const categoryId = categoryRef.id;
      await setDoc(categoryRef, {
        id: categoryId,
        name: newCategoryName.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setValue("categoryId", categoryId, { shouldValidate: true });
      setNewCategoryName("");
      setIsAddingCategory(false);
      toast.success("Categoría creada");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Error al crear la categoría");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const generateInternalCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setValue("code", code);
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      // 1. Validar unicidad del código en Dexie (caché local rápida)
      const existingProduct = await dexie.products
        .where("code")
        .equals(data.code)
        .first();

      if (existingProduct && (!initialData || existingProduct.id !== initialData.id)) {
        toast.error(`El código "${data.code}" ya está asignado al producto: ${existingProduct.name}`);
        return;
      }

      if (initialData) {
        // Actualizar
        const productRef = doc(firestore, "products", initialData.id);
        await updateDoc(productRef, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success("Producto actualizado correctamente");
      } else {
        // Crear nuevo
        const productRef = doc(collection(firestore, "products"));
        await setDoc(productRef, {
          id: productRef.id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success("Producto creado correctamente");
      }
      onSuccess();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      toast.error("Error al guardar el producto");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Código */}
        <Input
          label="Código (EAN o Interno)"
          required={true}
          labelRightContent={
            <button
              type="button"
              onClick={generateInternalCode}
              className="text-xs font-bold text-primary hover:text-primary-dark cursor-pointer"
            >
              Generar Interno
            </button>
          }
          error={errors.code?.message}
          placeholder="Ej: 779123456789"
          {...register("code")}
        />

        {/* Nombre */}
        <Input
          label="Nombre del Producto"
          required={true}
          error={errors.name?.message}
          placeholder="Ej: Yerba Mate 500g"
          {...register("name")}
        />

        {/* Marca */}
        <Input
          label="Marca"
          placeholder="Ej: Playadito"
          {...register("brand")}
        />

        {/* Categoría */}
        <div className="space-y-2">
          <div className=" flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700">Categoría</label>
            <button
              type="button"
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="text-xs font-bold cursor-pointer text-primary hover:text-primary-dark flex items-center gap-1"
            >
              {isAddingCategory ? (
                <>
                  <X className="w-3 h-3" />
                  <span>Cancelar</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Nueva</span>
                </>
              )}
            </button>
          </div>

          {isAddingCategory ? (
            <div className="flex gap-2 mt-1">
              <Input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de categoría"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isCreatingCategory || !newCategoryName.trim()}
                className="cursor-pointer flex items-center justify-center w-15 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {isCreatingCategory ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </button>
            </div>
          ) : (
            <Input
              type="select"
              required={true}
              className="mt-[-4px]"
              options={[
                { value: "", label: "Seleccionar categoría" },
                ...[...categories]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
              ]}
              {...register("categoryId")}
            />
          )}
        </div>

        {/* Precio de Costo */}
        <Input
          label="Precio de Costo"
          type="number"
          step="0.01"
          icon={<span className="text-gray-400 font-semibold">$</span>}
          iconPosition="left"
          error={errors.costPrice?.message}
          {...register("costPrice")}
        />

        {/* Precio de Venta */}
        <Input
          label="Precio de Venta"
          required={true}
          type="number"
          step="0.01"
          icon={<span className="text-gray-400 font-semibold">$</span>}
          iconPosition="left"
          error={errors.salePrice?.message}
          {...register("salePrice")}
        />

        {/* Unidad de Medida */}
        <Input
          label="Unidad de Medida"
          type="select"
          className="mt-1.5"
          options={[
            { value: "unit", label: "Unidad (Un)" },
            { value: "kg", label: "Kilogramo (Kg)" },
            { value: "100gr", label: "100 Gramos (100g)" },
          ]}
          {...register("quantityUnit")}
        />

        {/* Stock Actual */}
        <Input
          label="Stock Inicial"
          required={true}
          type="number"
          step={stockInputMode === "grams" ? "1" : "0.001"}
          placeholder={stockInputMode === "grams" ? "Ej: 500" : "Ej: 0.5"}
          error={errors.stock?.message}
          value={
            stockInputMode === "grams"
              ? (watch("stock") || 0) * 1000
              : watch("stock") || 0
          }
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0;
            setValue("stock", stockInputMode === "grams" ? val / 1000 : val, {
              shouldValidate: true,
            });
          }}
          {...register("stock")}
          iconPosition="right"
          icon={
            isWeightBased
              ? stockInputMode === "grams"
                ? "g"
                : "Kg"
              : undefined
          }
          labelRightContent={
            isWeightBased ? (
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setStockInputMode("base")}
                  className={clsx(
                    "cursor-pointer px-2 py-0.5 text-[10px] font-bold rounded-md transition-all",
                    stockInputMode === "base"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Kg
                </button>
                <button
                  type="button"
                  onClick={() => setStockInputMode("grams")}
                  className={clsx(
                    "cursor-pointer px-2 py-0.5 text-[10px] font-bold rounded-md transition-all",
                    stockInputMode === "grams"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Gramos
                </button>
              </div>
            ) : undefined
          }
        />

        {/* Stock Mínimo (Alerta) */}
        <Input
          label="Stock Mínimo (Alerta)"
          type="number"
          error={errors.minStock?.message}
          icon={
            isWeightBased ? (stockInputMode === "grams" ? "g" : "Kg") : "Un"
          }
          {...register("minStock")}
        />
      </div>

      {/* Bulk Pricing (Optional) */}
      <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Oferta por Bulto / Mayorista
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cantidad mínima"
            type="number"
            placeholder="Ej: 6"
            className="text-sm"
            {...register("bulkQuantity", { valueAsNumber: true })}
          />
          <Input
            label="Precio especial bulto"
            type="number"
            placeholder="$"
            className="text-sm"
            {...register("bulkPrice", { valueAsNumber: true })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} variant="primary">
        {isSubmitting
          ? "Guardando..."
          : initialData
            ? "Editar Producto"
            : "Crear Producto"}
      </Button>
    </form>
  );
};
