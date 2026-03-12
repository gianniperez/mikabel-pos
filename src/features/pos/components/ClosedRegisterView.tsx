"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { OpenSessionModal } from "./OpenSessionModal";
import { Button } from "@/components/Button/Button";

export const ClosedRegisterView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] w-full text-center px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-gray-400" />
      </div>

      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
        Caja Cerrada
      </h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        Deberás abrir un turno y declarar el sencillo en caja antes de registrar
        nuevas ventas.
      </p>

      <Button
        onClick={() => setIsModalOpen(true)}
        variant="primary"
        className="max-w-xs"
      >
        Abrir Turno
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <OpenSessionModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};
