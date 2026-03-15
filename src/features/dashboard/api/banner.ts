import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export type BannerType = "info" | "warning" | "danger";

export interface BannerData {
  message: string;
  type: BannerType;
  updatedAt?: any;
  updatedBy?: string;
}

const DASHBOARD_CONFIG_DOC = "dashboard";
const CONFIG_COLLECTION = "config";

export const subscribeToBanner = (
  callback: (data: BannerData | null) => void,
) => {
  const docRef = doc(db, CONFIG_COLLECTION, DASHBOARD_CONFIG_DOC);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        message: data.banner?.message || "",
        type: data.banner?.type || "info",
        updatedAt: data.banner?.updatedAt,
        updatedBy: data.banner?.updatedBy,
      });
    } else {
      callback(null);
    }
  });
};

export const updateBanner = async (
  message: string,
  type: BannerType,
  adminName: string,
) => {
  const docRef = doc(db, CONFIG_COLLECTION, DASHBOARD_CONFIG_DOC);

  await setDoc(
    docRef,
    {
      banner: {
        message,
        type,
        updatedAt: serverTimestamp(),
        updatedBy: adminName,
      },
    },
    { merge: true },
  );
};
