"use client";

import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { UserPermissionModal, PERMISSION_LABELS } from "./UserPermissionModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { User } from "@/types/models";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import Image from "next/image";
import {
  Users,
  Mail,
  Shield,
  ShieldCheck,
  Cog,
  Loader2,
  Trash2,
  UserPen,
} from "lucide-react";
import { clsx } from "clsx";

export const UserList = () => {
  const {
    users,
    isLoading,
    updateRole,
    updatePermissions,
    removeUser,
    isUpdating,
  } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold animate-pulse">Cargando equipo...</p>
      </div>
    );
  }

  const handleManageUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Stat */}
      <div className="flex items-center gap-4 bg-primary/5 border border-primary/10 p-4 rounded-mikabel">
        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl text-white">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-primary-dark">
            Gestionar Equipo
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            Tienes {users.length} operadores registrados
          </p>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Permisos
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user?.photoURL ? (
                      <Image
                        src={user?.photoURL || ""}
                        alt={user?.name || "Usuario"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black",
                      user.role === "admin"
                        ? "bg-primary-light/20 text-primary"
                        : "bg-secondary-light/30 text-secondary-dark",
                    )}
                  >
                    {user.role === "admin" ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    {user.role === "admin" ? "Admin" : "Operadora"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap max-w-xs">
                    {user.permissions &&
                      Object.entries(user.permissions)
                        .filter(([_, val]) => val)
                        .map(([key]) => (
                          <span
                            key={key}
                            className="text-[10px] bg-success/10 text-success-dark font-bold px-1.5 py-0.5 rounded uppercase"
                          >
                            {PERMISSION_LABELS[
                              key as keyof typeof PERMISSION_LABELS
                            ]?.label || key}
                          </span>
                        ))}
                    {!user.permissions ||
                    Object.values(user.permissions).every((v) => !v) ? (
                      <span className="text-[10px] text-gray-400 italic">
                        Sin permisos extra
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="h-9 gap-2 font-bold px-3 py-1 text-sm hover:text-primary hover:bg-primary-light/30"
                      onClick={() => handleManageUser(user)}
                    >
                      <UserPen className="w-4 h-4" />
                      Gestionar
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-9 px-2 text-gray-400 hover:text-danger hover:bg-danger/20"
                      onClick={() => handleDeleteClick(user)}
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {users.map((user) => (
          <Card key={user.uid} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {user?.photoURL ? (
                  <Image
                    src={user?.photoURL || ""}
                    alt={user?.name || "Usuario"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-[40px] h-[40px] rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{user.name}</span>
                  <span className="text-[10px] text-gray-500 overflow-hidden text-ellipsis w-44">
                    {user.email}
                  </span>
                </div>
              </div>
              <div
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black",
                  user.role === "admin"
                    ? "bg-primary-light/20 text-primary"
                    : "bg-secondary-light/30 text-secondary-dark",
                )}
              >
                {user.role === "admin" ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {user.role === "admin" ? "Admin" : "Operadora"}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase">
                Permisos Extra
              </h4>
              <div className="flex gap-1 flex-wrap">
                {user.permissions &&
                  Object.entries(user.permissions)
                    .filter(([_, val]) => val)
                    .map(([key]) => (
                      <span
                        key={key}
                        className="text-[10px] bg-success/10 text-success-dark font-bold px-1.5 py-0.5 rounded uppercase"
                      >
                        {PERMISSION_LABELS[
                          key as keyof typeof PERMISSION_LABELS
                        ]?.label || key}
                      </span>
                    ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-4 gap-2 font-bold h-11"
                onClick={() => handleManageUser(user)}
              >
                <UserPen className="w-4 h-4" />
                Configurar
              </Button>
              <Button
                variant="outline"
                className="flex-1 px-0 border-danger/10 text-danger hover:bg-danger/10 hover:text-danger-dark h-11"
                onClick={() => handleDeleteClick(user)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <UserPermissionModal
        key={selectedUser?.uid || "none"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onUpdateRole={(role) =>
          selectedUser && updateRole({ userId: selectedUser.uid, role })
        }
        onUpdatePermissions={(permissions) =>
          selectedUser &&
          updatePermissions({ userId: selectedUser.uid, permissions })
        }
        isUpdating={isUpdating}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={selectedUser}
        onConfirm={() => selectedUser && removeUser(selectedUser.uid)}
        isDeleting={isUpdating}
      />
    </div>
  );
};
