export type CashSessionStatus = "open" | "closed";

export interface CashSession {
  id: string; // Document ID
  employeeId: string; // UID del empleado
  status: CashSessionStatus;
  openingAmount: number;
  totalMovements: number;
  totalCashSales: number;
  totalTransferSales: number;
  totalDebtSales: number;
  totalDebtPayments: number;
  closingAmount: number | null;
  systemCalculated: number | null;
  difference: number | null;
  openedAt: number; // Timestamp en millis o Firestore Timestamp transformado
  closedAt: number | null;
}

export type CashMovementType = "supplier_payment" | "owner_withdrawal";

export interface CashMovement {
  id: string;
  sessionId: string;
  employeeId: string;
  amount: number;
  type: CashMovementType;
  description: string;
  createdAt: number;
}
