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
  writeBatch,
  increment,
  orderBy,
} from "firebase/firestore";
import { Customer, Debt } from "../types/debt";

// --- CLIENTES ---

export const getCustomers = async (): Promise<Customer[]> => {
  const q = query(collection(db, "customers"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
};

export const createCustomer = async (name: string): Promise<Customer> => {
  const customerData = {
    name,
    totalDebt: 0,
  };
  const docRef = await addDoc(collection(db, "customers"), customerData);
  return {
    id: docRef.id,
    ...customerData,
  };
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const docRef = doc(db, "customers", id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Customer;
  }
  return null;
};

export const editCustomer = async (id: string, newName: string): Promise<void> => {
  const docRef = doc(db, "customers", id);
  await updateDoc(docRef, { name: newName });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const docRef = doc(db, "customers", id);
  await deleteDoc(docRef);
};

// --- DEUDAS (FIADOS) ---

export const getCustomerDebts = async (customerId: string): Promise<Debt[]> => {
  const q = query(
    collection(db, "debts"),
    where("customerId", "==", customerId),
  );
  const snapshot = await getDocs(q);
  const fetchedDebts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      paidAt: data.paidAt?.toDate() || null,
    } as Debt;
  });

  // Client-side sort to avoid Firestore composite index requirement (where + orderBy)
  return fetchedDebts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Registra un abono/pago sobre una deuda existente.
 * MUY IMPORTANTE: Exige enviar el Session ID abierto para adjudicar el dinero al arqueo caja.
 */
export const registerDebtPayment = async (
  debtId: string,
  customerId: string,
  amountToPay: number,
  sessionId: string,
  employeeId: string,
): Promise<void> => {
  const batch = writeBatch(db);

  // 1. Obtener la deuda actual paral saber cuánto falta
  const debtRef = doc(db, "debts", debtId);
  const debtSnap = await getDoc(debtRef);

  if (!debtSnap.exists()) throw new Error("Deuda no encontrada");

  const debtData = debtSnap.data() as Omit<Debt, "id">;

  const newPaidAmount = debtData.paidAmount + amountToPay;
  const isFullyPaid = newPaidAmount >= debtData.amount;

  // A. Actualizar Deuda
  batch.update(debtRef, {
    paidAmount: newPaidAmount,
    status: isFullyPaid ? "paid" : "partial",
    paidAt: isFullyPaid ? new Date() : null,
  });

  // B. Restar al Total del Cliente
  const customerRef = doc(db, "customers", customerId);
  batch.update(customerRef, {
    totalDebt: increment(-amountToPay),
  });

  // C. Sumar físicamente el billete de pago a la Caja / Sesión Actual
  const sessionRef = doc(db, "cash_sessions", sessionId);
  batch.update(sessionRef, {
    totalDebtPayments: increment(amountToPay),
  });

  // D. (Opcional - MVP) Generar quizás un cash_movement si en algún momento facturan el recibo

  await batch.commit();
};
