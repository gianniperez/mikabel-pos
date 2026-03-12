import Dexie from "dexie";

// Definiciones de tipos para la caché local en IndexedDB.
// Estos espejan la estructura de Firestore para permitir lecturas instantáneas (zero-latency).

export interface LocalCategory {
  id: string;
  name: string;
}

export interface LocalProduct {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  photoUrl: string | null;
  categoryId: string;
  salePrice: number;
  costPrice: number;
  bulkPrice: number | null;
  bulkQuantity: number | null;
  quantityUnit: "kg" | "unit" | "100gr";
  stock: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
}

// Definición de la base de datos
const db = new Dexie("MikabelDB") as Dexie & {
  products: Dexie.Table<LocalProduct, string>;
  categories: Dexie.Table<LocalCategory, string>;
};

// Esquema: la PK es 'id'. Los índices se usan para búsquedas frecuentes.
db.version(1).stores({
  products: "id, code, name, categoryId",
  categories: "id, name",
});

export { db };
