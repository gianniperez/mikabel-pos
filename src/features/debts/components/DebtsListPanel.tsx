"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomerDebts,
  registerDebtPayment,
} from "@/features/debts/api/debtsDb";
import { Customer, Debt } from "@/features/debts/types/debt";
import { useCashSessionStore } from "@/features/pos/stores/useCashSessionStore";
import { useAuthStore } from "@/features/auth/stores";
import { X, Receipt, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

interface Props {
  customer: Customer;
  onClose: () => void;
}

export const DebtsListPanel = ({ customer, onClose }: Props) => {
  const queryClient = useQueryClient();
  const { firebaseUser: user } = useAuthStore();
  const { isOpen, activeSession } = useCashSessionStore();

  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [amountToPay, setAmountToPay] = useState<number | "">("");

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["debts", customer.id],
    queryFn: () => getCustomerDebts(customer.id),
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ debt, amount }: { debt: Debt; amount: number }) => {
      if (!user) throw new Error("No hay usuario logueado");
      if (!isOpen || !activeSession)
        throw new Error("La caja debe estar abierta");

      await registerDebtPayment(
        debt.id,
        customer.id,
        amount,
        activeSession.id,
        user.uid,
      );
    },
    onSuccess: () => {
      toast.success("Pago registrado correctamente");
      setPayingDebtId(null);
      setAmountToPay("");
      queryClient.invalidateQueries({ queryKey: ["debts", customer.id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al procesar el pago");
    },
  });

  const handlePay = (debt: Debt) => {
    const amount = Number(amountToPay);
    if (!amount || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    const maxPayable = debt.amount - debt.paidAmount;
    if (amount > maxPayable) {
      toast.error(`No puedes pagar más del saldo deudor ($${maxPayable})`);
      return;
    }

    paymentMutation.mutate({ debt, amount });
  };

  return (
    <>
      {/* Backdrop para cerrar al tocar fuera */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:max-w-[450px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 border-l border-gray-200">
        {/* Header Fijo */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between pt-4 px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900">
                {customer.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 pt-0 bg-gray-50/50">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
              Monto Total a Cobrar
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-4xl font-black ${customer.totalDebt > 0 ? "text-danger" : "text-success"}`}
              >
                ${customer.totalDebt.toLocaleString("es-AR")}
              </p>
            </div>

            {!isOpen && customer.totalDebt > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl flex items-start gap-2 animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <p>
                  <strong>Caja Cerrada:</strong> Abrí tu turno en el POS para
                  poder registrar entregas de efectivo.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400">
              Cargando recibos...
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No hay historial de deudas para este cliente.
            </div>
          ) : (
            debts.map((debt) => {
              const isFullyPaid = debt.status === "paid";
              const saldo = debt.amount - debt.paidAmount;

              return (
                <Card
                  key={debt.id}
                  variant="default"
                  padding="default"
                  className="space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-700">
                          {debt.createdAt?.toLocaleDateString("es-AR") ||
                            "Fecha desconocida"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Ticket: {debt.saleId?.split("_")[1] || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-bold ${
                        isFullyPaid
                          ? "bg-green-100 text-green-700"
                          : debt.status === "partial"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-danger"
                      }`}
                    >
                      {isFullyPaid
                        ? "PAGADO"
                        : debt.status === "partial"
                          ? "PARCIAL"
                          : "PENDIENTE"}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500">
                        Monto Original: ${debt.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        Abonado: ${debt.paidAmount}
                      </p>
                      {!isFullyPaid && (
                        <p className="text-sm font-bold text-danger mt-1">
                          Restante: ${saldo}
                        </p>
                      )}
                    </div>

                    {!isFullyPaid && isOpen && (
                      <div className="text-right">
                        {payingDebtId === debt.id ? (
                          <div className="flex flex-col gap-2 items-end">
                            <Input
                              type="number"
                              min={1}
                              max={saldo}
                              value={amountToPay}
                              onChange={(e) =>
                                setAmountToPay(Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 text-sm border-primary"
                              placeholder="Monto"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setPayingDebtId(null)}
                                variant="secondary"
                                className="px-3 py-2 text-xs"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handlePay(debt)}
                                disabled={paymentMutation.isPending}
                                variant="primary"
                                className="px-3 py-2 text-xs"
                              >
                                {paymentMutation.isPending ? "..." : "Abonar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              setPayingDebtId(debt.id);
                              setAmountToPay(saldo); // Default value is the exact remainder
                            }}
                            variant="primary"
                            className="px-3 py-1.5 text-sm rounded-lg"
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
