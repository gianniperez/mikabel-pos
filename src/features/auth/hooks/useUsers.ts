import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../api/authDb";
import { useMemo } from "react";

export const useUsers = () => {
  const { data: users = [], ...rest } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  const userMap = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.uid] = user.name;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [users]);

  return { users, userMap, ...rest };
};
