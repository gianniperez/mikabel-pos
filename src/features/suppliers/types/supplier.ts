export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  contactName?: string;
  totalPaid: number;
  totalPending: number;
  createdAt: any;
}

export type PaymentMethod = "cash" | "transfer" | "card" | "debt";

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  description: string;
  sessionId: string;
  employeeId: string;
  paymentMethod: PaymentMethod;
  createdAt: any;
}
