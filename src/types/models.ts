export type UserRole = "admin" | "employee";

export interface User {
  uid: string;
  name: string;
  photoURL: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export type QuantityUnit = "kg" | "unit" | "100gr";

export interface Product {
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
  quantityUnit: QuantityUnit;
  stock: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
}

export type SaleStatus = "completed" | "refunded" | "cancelled";

export interface SurchargeConfig {
  type: "percentage" | "fixed";
  value: number;
}

export interface DiscountConfig {
  type: "percentage" | "fixed";
  value: number;
}

export interface PaymentMethod {
  method: "cash" | "card" | "transfer" | "debt";
  amount: number;
}

export interface Sale {
  id: string;
  vendedoraId: string;
  sessionId: string;
  subtotal: number;
  surchargeConfig: SurchargeConfig | null;
  discountConfig: DiscountConfig | null;
  total: number;
  payments: PaymentMethod[];
  status: SaleStatus;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
  bulkApplied: boolean;
}

export type CashSessionStatus = "open" | "closed";

export interface CashSession {
  id: string;
  employeeId: string;
  status: CashSessionStatus;
  openingAmount: number;
  closingAmount: number | null;
  systemCalculated: number | null;
  difference: number | null;
  openedAt: Date;
  closedAt: Date | null;
}

export type CashMovementType = "supplier_payment" | "owner_withdrawal";

export interface CashMovement {
  id: string;
  sessionId: string;
  employeeId: string;
  amount: number;
  type: CashMovementType;
  description: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  totalDebt: number;
}

export type DebtStatus = "pending" | "partial" | "paid";

export interface Debt {
  id: string;
  customerId: string;
  saleId: string | null;
  amount: number;
  paidAmount: number;
  status: DebtStatus;
  employeeId: string;
  createdAt: Date;
  paidAt: Date | null;
}
