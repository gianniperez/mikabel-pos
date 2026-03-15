"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/dialog/Modal";
import { Button } from "@/components/Button";
import { User, UserPermissions } from "@/types/models";
import { Shield, User as UserIcon, Check } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateRole: (role: "admin" | "employee") => void;
  onUpdatePermissions: (permissions: UserPermissions) => void;
  isUpdating: boolean;
}

export const PERMISSION_LABELS: Record<
  keyof UserPermissions,
  { label: string; desc: string }
> = {
  edit_stock: {
    label: "Editar Stock",
    desc: "Permite usar los botones +/- en el inventario.",
  },
  edit_prices: {
    label: "Editar Precios",
    desc: "Permite modificar el precio de venta inline.",
  },
  edit_product: {
    label: "Editar Producto",
    desc: "Permite abrir el formulario y ver costos.",
  },
  delete_customer: {
    label: "Editar Clientes",
    desc: "Permite borrar registros de clientes en Deudas.",
  },
  view_reports: {
    label: "Ver Reportes",
    desc: "Habilita el acceso a la sección de estadísticas.",
  },
};

export const UserPermissionModal = ({
  isOpen,
  onClose,
  user,
  onUpdateRole,
  onUpdatePermissions,
  isUpdating,
}: Props) => {
  const [role, setRole] = useState<"admin" | "employee">(
    user?.role || "employee",
  );
  const [permissions, setPermissions] = useState<UserPermissions | null>(
    user?.permissions || {
      edit_stock: false,
      edit_prices: false,
      edit_product: false,
      delete_customer: false,
      view_reports: false,
    },
  );

  // Still update if user prop changes without re-mounting (though we'll use a key now)
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setPermissions(
        user.permissions || {
          edit_stock: false,
          edit_prices: false,
          edit_product: false,
          delete_customer: false,
          view_reports: false,
        },
      );
    }
  }, [user]);

  if (!user || !permissions) return null;

  const handleTogglePermission = (key: keyof UserPermissions) => {
    const newPermissions = {
      ...permissions,
      [key]: !permissions[key],
    };
    setPermissions(newPermissions);
  };

  const handleSave = () => {
    if (role !== user.role) {
      onUpdateRole(role);
    }
    onUpdatePermissions(permissions);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Usuario"
      description={`Configura los accesos para ${user.name}`}
      className="max-w-md"
    >
      <div className="space-y-6 pt-4">
        {/* Role Selection */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Rol del Sistema
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole("employee")}
              className={clsx(
                "flex items-center justify-center gap-2 p-3 rounded-mikabel border-2 transition-all font-semibold text-sm",
                role === "employee"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-100 text-gray-400 hover:border-gray-200",
              )}
            >
              <UserIcon className="w-4 h-4" />
              Empleado/a
            </button>
            <button
              onClick={() => setRole("admin")}
              className={clsx(
                "flex items-center justify-center gap-2 p-3 rounded-mikabel border-2 transition-all font-semibold text-sm",
                role === "admin"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-100 text-gray-400 hover:border-gray-200",
              )}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>

        {/* Permissions Toggles */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Permisos Específicos
          </h4>
          <div className="space-y-2">
            {(
              Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>
            ).map((key) => (
              <button
                key={key}
                onClick={() => handleTogglePermission(key)}
                className={clsx(
                  "w-full flex items-center justify-between p-3 rounded-mikabel border transition-all text-left group",
                  permissions[key]
                    ? "border-success/30 bg-success/5"
                    : "border-gray-100 bg-gray-50/50 grayscale opacity-70",
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={clsx(
                      "font-bold text-sm",
                      permissions[key] ? "text-success-dark" : "text-gray-600",
                    )}
                  >
                    {PERMISSION_LABELS[key].label}
                  </span>
                  <span className="text-[11px] text-gray-400 leading-tight">
                    {PERMISSION_LABELS[key].desc}
                  </span>
                </div>
                <div
                  className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                    permissions[key]
                      ? "bg-success text-white"
                      : "bg-gray-200 text-transparent group-hover:bg-gray-300",
                  )}
                >
                  <Check className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            isLoading={isUpdating}
          >
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
};
