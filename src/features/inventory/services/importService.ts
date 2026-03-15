import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db as firestore } from "@/lib/firebase";

interface SeedProduct {
  code: string;
  name: string;
  brand: string | null;
  categoryId: string;
  costPrice: number | null;
  salePrice: number;
  bulkPrice: number | null;
  bulkQuantity: number | null;
  stock: number;
  minStock: number | null;
  quantityUnit: "kg" | "unit" | "100gr";
}

export const importProductsFromJson = async (
  jsonContent: string,
  onProgress?: (processed: number, total: number) => void,
) => {
  const data = JSON.parse(jsonContent);
  const products: SeedProduct[] = data.products || [];

  if (products.length === 0) return { success: true, count: 0 };

  // 1. Obtener categorías existentes
  const categoriesSnapshot = await getDocs(collection(firestore, "categories"));
  const categoryMap = new Map<string, string>(); // Name -> ID
  categoriesSnapshot.docs.forEach((doc) => {
    categoryMap.set(doc.data().name.toLowerCase(), doc.id);
  });

  // 2. Asegurar que todas las categorías del JSON existen
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.categoryId)),
  );

  for (const catName of uniqueCategories) {
    if (!categoryMap.has(catName.toLowerCase())) {
      const newCatRef = doc(collection(firestore, "categories"));
      await setDoc(newCatRef, {
        id: newCatRef.id,
        name: catName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      categoryMap.set(catName.toLowerCase(), newCatRef.id);
    }
  }

  // 3. Procesar productos en lotes (Batches) de 500 (límite de Firestore)
  const CHUNK_SIZE = 500;
  let processedCount = 0;

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(firestore);

    for (const p of chunk) {
      // Usamos el código como parte del ID o simplemente buscamos por código
      // Para simplificar y evitar lecturas masivas, vamos a usar un ID generado por Firestore
      // pero si el usuario quiere "Actualizar", deberíamos buscar primero.
      // Dado que es un SEED, vamos a crear nuevos IDs para evitar problemas de colisión complejos
      // a menos que usemos el 'code' como ID de documento (peligroso si hay caracteres raros).

      const productRef = doc(collection(firestore, "products"));
      const categoryId =
        categoryMap.get(p.categoryId.toLowerCase()) || "Almacen";

      batch.set(productRef, {
        ...p,
        id: productRef.id,
        categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await batch.commit();
    processedCount += chunk.length;
    if (onProgress) onProgress(processedCount, products.length);
  }

  return { success: true, count: processedCount };
};
