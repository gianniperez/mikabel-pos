import type { ProductImageProps } from "./ProductImage.types";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function ProductImage({
  src,
  alt,
  className,
  showPlaceholder = true,
}: ProductImageProps) {
  if (!src && showPlaceholder) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-200 rounded-lg text-gray-400",
          className,
        )}
      >
        <ImageOff className="w-1/2 h-1/2" />
      </div>
    );
  }

  if (!src) return null;

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={(e) => {
          // Fallback simple si la imagen falla después de cargar
          (e.target as HTMLImageElement).src = "";
        }}
      />
    </div>
  );
}
