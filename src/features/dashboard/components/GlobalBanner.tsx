"use client";

import { useEffect, useState } from "react";
import {
  Edit3,
  Save,
  Loader2,
  Info,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/stores";
import {
  subscribeToBanner,
  updateBanner,
  type BannerData,
  type BannerType,
} from "../api/banner";
import { Button } from "@/components/Button";
import { Modal } from "@/components/ui/dialog/Modal";
import { Input } from "@/components/Input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BANNER_VARIANTS: Record<
  BannerType,
  {
    bg: string;
    icon: any;
    label: string;
    accent: string;
  }
> = {
  info: {
    bg: "from-secondary to-secondary-dark",
    accent: "text-white/70",
    icon: Info,
    label: "Aviso General",
  },
  warning: {
    bg: "from-amber-500 to-amber-600",
    accent: "text-amber-100",
    icon: AlertTriangle,
    label: "Sugerencia / Recordatorio",
  },
  danger: {
    bg: "from-danger to-danger-dark",
    accent: "text-red-100",
    icon: AlertOctagon,
    label: "Urgente / Atención",
  },
};

export const GlobalBanner = () => {
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === "admin";

  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editType, setEditType] = useState<BannerType>("info");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToBanner((data) => {
      setBanner(data);
      if (data) {
        setEditMessage(data.message);
        setEditType(data.type);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!dbUser) return;
    setIsSaving(true);
    try {
      await updateBanner(editMessage, editType, dbUser.name);
      setIsEditing(false);
      toast.success("Mensaje actualizado correctamente");
    } catch (error) {
      console.error("Error updating banner:", error);
      toast.error("Error al actualizar el mensaje");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-16 animate-pulse bg-gray-100 rounded-mikabel flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }

  // Si no hay mensaje y no es admin, no mostramos nada
  if (!banner?.message && !isAdmin) return null;

  const currentVariant =
    BANNER_VARIANTS[banner?.type || "info"] || BANNER_VARIANTS.info;
  const VariantIcon = currentVariant.icon;

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col justify-center min-h-24 overflow-hidden bg-linear-to-r rounded-mikabel shadow-md border border-primary-dark/10 group",
          currentVariant.bg,
        )}
      >
        <div className="relative px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <VariantIcon className="w-6 h-6 text-white group-hover:scale-120 transition-transform" />
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-xs uppercase font-black tracking-widest leading-none mb-1",
                  currentVariant.accent,
                )}
              >
                {currentVariant.label}
              </span>
              <p className="text-white font-bold text-xl leading-tight">
                {banner?.message ||
                  (isAdmin ? "Haz clic para agregar un mensaje..." : "")}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              className="shrink-0 cursor-pointer text-white mr-2"
              onClick={() => setIsEditing(true)}
              title="Editar mensaje"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Aviso General"
        description="Este mensaje será visible para todo el equipo en el inicio."
      >
        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tipo de Mensaje
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["info", "warning", "danger"] as BannerType[]).map((type) => {
                const variant = BANNER_VARIANTS[type];
                const Icon = variant.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setEditType(type)}
                    className={cn(
                      "cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-mikabel border-2 transition-all group",
                      editType === type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-100 text-gray-400 hover:border-gray-200",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        editType === type ? "text-primary" : "text-gray-300",
                      )}
                    />
                    <span className="text-[10px] font-black uppercase">
                      {type === "info"
                        ? "Informativo"
                        : type === "warning"
                          ? "Advertencia"
                          : "Urgente"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Mensaje"
            placeholder="Ej: Hoy reponer heladeras..."
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            autoFocus
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1 gap-2"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!editMessage}
            >
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
