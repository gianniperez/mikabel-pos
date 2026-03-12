import { useEffect, useRef } from "react";
import { usePosStore } from "../stores/usePosStore";
import { db } from "@/lib/dexie";
import { toast } from "sonner";

// Tiempo máximo entre tipeos para considerarlo un lector (en ms)
// Un humano teclea a ~100-300ms. Un lector láser inyecta a ~10-30ms.
const SCANNER_TIMEOUT_MS = 60; 

export const useGlobalBarcodeScanner = (isActive: boolean = true) => {
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);
  const { addToCart } = usePosStore();

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignorar eventos si el usuario está escribiendo explícitamente en un input/textarea real
      // (Por ej, el buscador manual de la grilla de productos)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentTime = new Date().getTime();

      // Si pasó mucho tiempo desde la última tecla, reseteamos el buffer porque es un humano o un error
      if (currentTime - lastKeyTime.current > SCANNER_TIMEOUT_MS) {
        barcodeBuffer.current = "";
      }

      lastKeyTime.current = currentTime;

      // Al recibir Enter, evaluamos el buffer
      if (e.key === "Enter") {
        const code = barcodeBuffer.current;
        if (code.length > 0) {
          e.preventDefault(); // Evitamos que un enter loco presione botones sueltos de la UI
          await processBarcode(code);
        }
        barcodeBuffer.current = ""; // Limpiamos para la próxima ráfaga
        return;
      }

      // Si es un caracter válido numérico o alfabético (algunos EAN incluyen letras)
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    const processBarcode = async (code: string) => {
      try {
        // Zero-Latency: Buscamos rápido en RAM (IndexedDB)
        const product = await db.products.where("code").equals(code).first();
        
        if (product) {
          addToCart(product, 1);
          // Toast opcional para feedback visual, pero el beep láser y ver el item suele bastar.
          toast.success(`Leído: ${product.name}`);
        } else {
          // Acá pondríamos reproducir un *.mp3 fiero de error
          toast.error(`Producto inexistente (${code})`);
        }
      } catch (err) {
        console.error("Error al procesar scanner:", err);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, addToCart]);
};
