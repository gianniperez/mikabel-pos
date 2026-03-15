import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserRole, UserPermissions } from "@/types/models";

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as unknown as User[];
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { role, updatedAt: new Date() });
};

export const updateUserPermissions = async (
  userId: string,
  permissions: UserPermissions,
) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { permissions, updatedAt: new Date() });
};

export const deleteUser = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
};
