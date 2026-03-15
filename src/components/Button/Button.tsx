import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";
import type { ButtonProps } from "./Button.types";

function cn(...buttons: ClassValue[]) {
  return twMerge(clsx(buttons));
}

export function Button({
  children,
  className,
  variant = "primary",
  rounded = "normal",
  disabled,
  isLoading,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "w-full py-3.5 bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
    secondary:
      "w-full py-3.5 bg-secondary text-white hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
    destructive:
      "w-full py-3.5 bg-danger text-white hover:bg-danger-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
    outline:
      "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-50 transition-colors",
  };

  return (
    <button
      className={cn(
        "cursor-pointer flex items-center justify-center gap-2 py-4 font-display font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center",
        variantStyles[variant],
        rounded == "full" ? "rounded-full px-8" : "rounded-mikabel px-6",
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Esperando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
