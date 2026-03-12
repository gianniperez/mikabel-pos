import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { User as DbUser } from "@/types/models";

export const getAllUsers = async (): Promise<DbUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      } as DbUser;
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};
