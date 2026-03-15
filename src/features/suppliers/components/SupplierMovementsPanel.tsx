"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSupplierMovements,
  registerSupplierDebtPayment,
} from "../api/suppliersDb";
import { Supplier } from "../types/supplier";
import {
  X,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
  Banknote,
  BanknoteArrowDown,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { Card } from "@/components/Card";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/stores";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";

interface Props {
  supplier: Supplier;
  onClose: () => void;
}

const PAYMENT_METHODS = {
  cash: {
    label: "Efectivo",
    icon: <Banknote className="h-4 w-4" />,
    color: "text-success bg-success-light/20",
  },
  transfer: {
    label: "Transferencia",
    icon: <BanknoteArrowDown className="h-4 w-4" />,
    color: "text-primary bg-primary-light/20",
  },
  card: {
    label: "Tarjeta",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-secondary bg-secondary-light/20",
  },
  debt: {
    label: "Deuda Pendiente",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-danger bg-red-50",
  },
};

export const SupplierMovementsPanel = ({ supplier, onClose }: Props) => {
  const { dbUser } = useAuthStore();
  const { activeSession } = useCashSessionStore();
  const queryClient = useQueryClient();
  const [payingMovementId, setPayingMovementId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [affectCashDrawer, setAffectCashDrawer] = useState(true);

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["supplierMovements", supplier.id],
    queryFn: () => getSupplierMovements(supplier.id),
  });

  const { mutate: payDebt, isPending: isPaying } = useMutation({
    mutationFn: ({
      movementId,
      amount,
    }: {
      movementId: string;
      amount: number;
    }) =>
      registerSupplierDebtPayment(
        movementId,
        supplier.id,
        amount,
        activeSession?.id || null,
        affectCashDrawer,
        dbUser,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplierMovements", supplier.id],
      });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Pago registrado correctamente");
      setPayingMovementId(null);
      setPaymentAmount("");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al registrar el pago");
    },
  });

  const handlePayClick = (movement: any) => {
    if (payingMovementId === movement.id) {
      setPayingMovementId(null);
    } else {
      setPayingMovementId(movement.id);
      const pending = movement.amount - (movement.paidAmount || 0);
      setPaymentAmount(pending.toString());
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:max-w-[450px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 border-l border-gray-200">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-baseline justify-between pt-4 px-6">
            <div className="flex flex-col items-start mb-8">
              <h2 className="text-2xl font-black text-gray-900">
                {supplier.name}
              </h2>
              {supplier.contactName && (
                <div className="flex items-center font-bold gap-2 text-gray-500">
                  <User className="h-4 w-4" />
                  <span>{supplier.contactName}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center font-bold gap-1 text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span>+54 9 {supplier.phone}</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 pt-0 bg-gray-50/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                  Total Pagado
                </p>
                <p className="text-2xl font-black text-gray-900">
                  ${(supplier.totalPaid || 0).toLocaleString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                  Deuda Pendiente
                </p>
                <p
                  className={`text-2xl font-black ${supplier.totalPending > 0 ? "text-danger" : "text-success"}`}
                >
                  ${(supplier.totalPending || 0).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">
            Historial de Movimientos
          </h3>

          {isLoading ? (
            <div className="text-center py-10 text-gray-400">
              Cargando movimientos...
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No hay movimientos registrados para este proveedor.
            </div>
          ) : (
            movements.map((movement: any) => {
              const method =
                PAYMENT_METHODS[
                  movement.paymentMethod as keyof typeof PAYMENT_METHODS
                ] || PAYMENT_METHODS.cash;

              const isDebt = movement.paymentMethod === "debt";
              const pendingAmount = isDebt
                ? movement.amount - (movement.paidAmount || 0)
                : 0;
              const isPaid = isDebt && movement.status === "paid";

              return (
                <Card
                  key={movement.id}
                  className={`p-4 space-y-3 relative overflow-hidden transition-all duration-300 ${payingMovementId === movement.id ? "ring-2 ring-primary bg-primary-light/5" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">
                          {movement.createdAt.toLocaleDateString("es-AR")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {movement.createdAt.toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {movement.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900">
                        ${movement.amount.toLocaleString("es-AR")}
                      </p>
                      {isDebt && movement.paidAmount > 0 && (
                        <p className="text-[10px] font-bold text-success uppercase">
                          Pagado: ${movement.paidAmount.toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isPaid ? "text-success bg-green-50" : method.color}`}
                    >
                      {isPaid ? <Banknote className="h-4 w-4" /> : method.icon}
                      {isPaid ? "Saldado" : method.label}
                    </div>

                    {isDebt && !isPaid && (
                      <button
                        onClick={() => handlePayClick(movement)}
                        className={`flex items-center gap-1 text-xs font-bold cursor-pointer px-4 py-2 rounded-full transition-all ${payingMovementId === movement.id ? "bg-gray-100 text-gray-500" : "bg-primary text-white hover:bg-primary-dark shadow-sm"}`}
                      >
                        {payingMovementId === movement.id ? (
                          <>
                            Cerrar <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Abonar <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    )}

                    {!isDebt && (
                      <span className="text-[10px] font-bold text-gray-300 uppercase italic">
                        {movement.type === "supplier_payment"
                          ? "Pago Proveedor"
                          : "Abono a Deuda"}
                      </span>
                    )}
                  </div>

                  {/* Interfaz de Pago */}
                  {payingMovementId === movement.id && (
                    <div className="mt-4 pt-4 border-t border-primary/10 animate-in slide-in-from-top duration-300">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Registrar Abono
                          </p>
                          <p className="text-xs font-black text-primary">
                            Saldo Pendiente: $
                            {pendingAmount.toLocaleString("es-AR")}
                          </p>
                        </div>

                        <Input
                          label="Monto a pagar"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          icon={
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          }
                        />

                        <div className="flex items-center gap-2 px-2 py-4 md:py-2 bg-blue-50/50 rounded-lg border border-blue-100">
                          <input
                            type="checkbox"
                            role="checkbox"
                            id={`affectDrawer-${movement.id}`}
                            checked={affectCashDrawer && !!activeSession}
                            onChange={(e) =>
                              setAffectCashDrawer(e.target.checked)
                            }
                            disabled={!activeSession}
                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                          />
                          <label
                            htmlFor={`affectDrawer-${movement.id}`}
                            className={`text-xs font-bold ${!activeSession ? "text-gray-400" : "text-blue-700 cursor-pointer"}`}
                          >
                            {activeSession
                              ? "¿Descontar de la caja actual?"
                              : "Caja cerrada (efectivo externo)"}
                          </label>
                        </div>

                        <Button
                          disabled={
                            isPaying ||
                            !paymentAmount ||
                            parseFloat(paymentAmount) <= 0
                          }
                          onClick={() =>
                            payDebt({
                              movementId: movement.id,
                              amount: parseFloat(paymentAmount),
                            })
                          }
                        >
                          {isPaying ? "Procesando..." : "Confirmar Pago"}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

// Icono faltante no importado en el scope superior si se usa dinamicamente
function DollarSign({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
