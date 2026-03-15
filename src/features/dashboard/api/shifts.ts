import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { CashSession } from "../../pos/types/cashSession";

export interface ActiveSessionWithUser extends CashSession {
  userName: string;
}

export const subscribeToActiveSessions = (
  callback: (sessions: ActiveSessionWithUser[]) => void,
) => {
  const sessionsQuery = query(
    collection(db, "cash_sessions"),
    where("status", "==", "open"),
  );

  return onSnapshot(sessionsQuery, async (snapshot) => {
    const sessions: ActiveSessionWithUser[] = [];

    // Obtenemos los nombres de usuario para cada sesión
    const userPromises = snapshot.docs.map(async (docSnap) => {
      const sessionData = docSnap.data() as CashSession;

      // Intentamos obtener el nombre del usuario desde la colección de usuarios
      try {
        const userDocRef = doc(db, "users", sessionData.employeeId);
        const userSnap = await getDoc(userDocRef);

        return {
          ...sessionData,
          id: docSnap.id,
          userName: userSnap.exists() ? userSnap.data().name : "Desconocido",
        };
      } catch (error) {
        console.error("Error fetching user for session:", error);
        return {
          ...sessionData,
          id: docSnap.id,
          userName: "Desconocido",
        };
      }
    });

    const results = await Promise.all(userPromises);
    callback(results);
  });
};
