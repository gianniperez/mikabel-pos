export interface Customer {
  id: string;
  name: string;
  totalDebt: number;
}

export interface Debt {
  id: string;
  customerId: string;
  saleId: string | null;
  amount: number;
  paidAmount: number;
  status: "pending" | "partial" | "paid";
  employeeId: string;
  createdAt: Date;
  paidAt: Date | null;
}

export interface DebtPaymentInfo {
  debtId: string;
  amountToPay: number; // Abono que se hace ahora
}
