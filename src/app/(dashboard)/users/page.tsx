"use client";

import { PageHeader } from "@/components/PageHeader";
import { UserList } from "@/features/users/components/UserList";
import { useAuthStore } from "@/features/auth/stores";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UsersPage() {
  const { dbUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (dbUser && dbUser.role !== "admin") {
      router.replace("/");
    }
  }, [dbUser, router]);

  if (!dbUser || dbUser.role !== "admin") return null;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Gestión de Usuarios"
        description="Administra los roles y permisos de tu equipo de trabajo."
      />

      <UserList />
    </div>
  );
}
