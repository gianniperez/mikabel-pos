import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  updateUserRole,
  updateUserPermissions,
  deleteUser,
} from "../api/usersDb";
import { UserRole, UserPermissions } from "@/types/models";
import { toast } from "sonner";

export const useUsers = () => {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol actualizado");
    },
    onError: () => toast.error("Error al actualizar el rol"),
  });

  const permissionsMutation = useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: UserPermissions;
    }) => updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Permisos actualizados");
    },
    onError: () => toast.error("Error al actualizar los permisos"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado");
    },
    onError: () => toast.error("Error al eliminar el usuario"),
  });

  return {
    users,
    isLoading,
    error,
    updateRole: roleMutation.mutate,
    updatePermissions: permissionsMutation.mutate,
    removeUser: deleteMutation.mutate,
    isUpdating:
      roleMutation.isPending ||
      permissionsMutation.isPending ||
      deleteMutation.isPending,
  };
};
