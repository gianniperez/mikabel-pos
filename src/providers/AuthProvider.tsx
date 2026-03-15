"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/features/auth/stores";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useInventorySync } from "@/features/inventory/hooks";
import { User as DbUser, UserPermissions } from "@/types/models";

const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  edit_stock: false,
  edit_prices: false,
  edit_product: false,
  delete_customer: false,
  view_reports: false,
};

const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  edit_stock: true,
  edit_prices: true,
  edit_product: true,
  delete_customer: true,
  view_reports: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, loading, firebaseUser, dbUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Sincronización automática de inventario (Firestore -> IndexedDB)
  useInventorySync(!!dbUser);
  useEffect(() => {
    // Usamos setTimeout para evitar el warning de cascading renders
    const timer = setTimeout(() => setMounted(true), 0);

    // 1. Manejar el resultado de Redirect si estamos volviendo de Google (PWA)
    console.log("[Auth] Checking redirect result...");
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("[Auth] Redirect login successful:", result.user.email);
          toast.success(`Sesión recuperada: ${result.user.email}`);
        } else {
          console.log("[Auth] No redirect result found");
        }
      })
      .catch((error) => {
        console.error("[Auth] Redirect login error:", error);
        toast.error(`Error en Redirección: ${error.code}`);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Buscamos el rol del usuario en la base de datos
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          let newUserData = null;

          if (userSnap.exists()) {
            const data = userSnap.data();
            // Si la foto cambió en Google, actualizamos Firestore
            if (user.photoURL && data.photoURL !== user.photoURL) {
              await setDoc(
                userRef,
                { photoURL: user.photoURL },
                { merge: true },
              );
            }
            setAuth(user, {
              ...data,
              photoURL: user.photoURL || data.photoURL,
              permissions:
                data.permissions ||
                (data.role === "admin"
                  ? DEFAULT_ADMIN_PERMISSIONS
                  : DEFAULT_EMPLOYEE_PERMISSIONS),
              createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            } as DbUser);
          } else {
            // Documento no existe, lo creamos automáticamente
            newUserData = {
              id: user.uid,
              uid: user.uid,
              name:
                user.displayName ||
                user.email?.split("@")[0] ||
                "Nuevo Usuario",
              email: user.email,
              photoURL: user.photoURL,
              role: "employee",
              permissions: DEFAULT_EMPLOYEE_PERMISSIONS,
              createdAt: new Date(),
            };
            await setDoc(userRef, newUserData);
            setAuth(user, newUserData as DbUser);
          }

          const dbUserData = userSnap.exists()
            ? (userSnap.data() as DbUser)
            : newUserData;

          // Si ya está logueado y trata de entrar a rutas de auth, lo mandamos al index
          if (
            pathname === "/login" ||
            pathname === "/forgot-password" ||
            pathname === "/reset-password" ||
            pathname === "/verify-email"
          ) {
            router.replace("/");
          } else if (
            (pathname === "/register" || pathname === "/users") &&
            dbUserData?.role !== "admin"
          ) {
            // Empleados regulares o usuarios nuevos no pueden entrar al register ni a gestión de usuarios
            toast.error("No tienes permisos para acceder a esta sección.");
            router.replace("/");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          clearAuth();
          router.replace("/login");
        }
      } else {
        // No hay usuario = deslogueado
        clearAuth();
        if (
          pathname !== "/login" &&
          pathname !== "/forgot-password" &&
          pathname !== "/reset-password" &&
          pathname !== "/verify-email"
        ) {
          router.replace("/login");
        }
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [setAuth, clearAuth, pathname, router]);

  const isPublicRoute = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ].includes(pathname);

  // 1. Mientras se monta el componente o está cargando el estado inicial
  if (!mounted || loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary-dark font-semibold animate-pulse">
          Iniciando Mikabel POS...
        </p>
      </div>
    );
  }

  // 2. Si no hay usuario y la ruta es privada, bloqueamos el renderizado de los hijos
  // Esto evita el "flickering" o parpadeo del dashboard antes de redireccionar al login
  if (!firebaseUser && !isPublicRoute) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
