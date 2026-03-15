import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import { Supplier } from "../types/supplier";
export type { Supplier };

export const getSuppliers = async (): Promise<Supplier[]> => {
  const q = query(collection(db, "suppliers"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Supplier[];
};

export const createSupplier = async (
  name: string,
  phone?: string,
  contactName?: string,
): Promise<Supplier> => {
  const supplierData = {
    name,
    phone: phone || null,
    contactName: contactName || null,
    totalPaid: 0,
    totalPending: 0,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "suppliers"), supplierData);
  return {
    id: docRef.id,
    ...supplierData,
  } as any as Supplier;
};

export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  const docRef = doc(db, "suppliers", id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Supplier;
  }
  return null;
};

export const updateSupplier = async (
  id: string,
  data: Partial<Omit<Supplier, "id" | "createdAt">>,
): Promise<void> => {
  const docRef = doc(db, "suppliers", id);
  await updateDoc(docRef, data);
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const docRef = doc(db, "suppliers", id);
  await deleteDoc(docRef);
};

export const getSupplierMovements = async (
  supplierId: string,
): Promise<any[]> => {
  const q = query(
    collection(db, "cash_movements"),
    where("supplierId", "==", supplierId),
  );
  const snapshot = await getDocs(q);
  const fetchedMovements = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Manejar tanto timestamps de Firestore como números (ms)
      createdAt:
        typeof data.createdAt === "number"
          ? new Date(data.createdAt)
          : data.createdAt?.toDate() || new Date(),
    };
  });

  return fetchedMovements.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
};

export const registerSupplierDebtPayment = async (
  movementId: string,
  supplierId: string,
  amountToPay: number,
  sessionId: string | null,
  affectCashDrawer: boolean,
  dbUser: any,
): Promise<void> => {
  const batch = writeBatch(db);

  // 1. Obtener el movimiento de deuda original
  const movementRef = doc(db, "cash_movements", movementId);
  const movementSnap = await getDoc(movementRef);

  if (!movementSnap.exists()) throw new Error("Movimiento no encontrado");

  const movementData = movementSnap.data() as any;
  const newPaidAmount = (movementData.paidAmount || 0) + amountToPay;
  const isFullyPaid = newPaidAmount >= movementData.amount;

  // 2. Actualizar Movimiento de Deuda
  batch.update(movementRef, {
    paidAmount: newPaidAmount,
    status: isFullyPaid ? "paid" : "partial",
  });

  // 3. Crear el movimiento de SALIDA de dinero (el pago)
  const paymentRef = doc(collection(db, "cash_movements"));
  batch.set(paymentRef, {
    id: paymentRef.id,
    sessionId: affectCashDrawer ? sessionId : null,
    employeeId: dbUser.uid,
    amount: amountToPay,
    type: "supplier_debt_payment",
    paymentMethod: "cash", // Los abonos desde el panel solemos asumirlos cash, pero se podría parametrizar
    description: `Abono a deuda: ${movementData.description}`,
    supplierId: supplierId,
    parentMovementId: movementId,
    createdAt: serverTimestamp(),
  });

  // 4. Restar al Pendiente del Proveedor
  const supplierRef = doc(db, "suppliers", supplierId);
  batch.update(supplierRef, {
    totalPending: increment(-amountToPay),
    totalPaid: increment(amountToPay),
  });

  // 5. Si afecta caja y hay sesión, actualizar arqueo
  if (affectCashDrawer && sessionId) {
    const sessionRef = doc(db, "cash_sessions", sessionId);
    batch.update(sessionRef, {
      totalMovements: increment(amountToPay),
    });
  }

  await batch.commit();
};
