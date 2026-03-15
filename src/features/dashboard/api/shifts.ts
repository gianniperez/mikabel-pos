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
      const data = docSnap.data();

      // Normalizamos el timestamp de Firestore a milisegundos
      const openedAt =
        data.openedAt?.toMillis?.() ||
        data.openedAt?.seconds * 1000 ||
        Date.now();

      const sessionData = {
        ...data,
        id: docSnap.id,
        openedAt,
      } as CashSession;

      // Intentamos obtener el nombre del usuario desde la colección de usuarios
      try {
        const userDocRef = doc(db, "users", sessionData.employeeId);
        const userSnap = await getDoc(userDocRef);

        return {
          ...sessionData,
          userName: userSnap.exists()
            ? (userSnap.data().name as string)
            : "Desconocido",
        };
      } catch (error) {
        console.error("Error fetching user for session:", error);
        return {
          ...sessionData,
          userName: "Desconocido",
        };
      }
    });

    const results = await Promise.all(userPromises);
    callback(results);
  });
};
