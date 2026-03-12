import { forwardRef } from "react";
import { clsx } from "clsx";
import type { CardProps } from "./Card.types";

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = "default", padding = "default", className, ...props },
    ref,
  ) => {
    const baseStyles = "bg-white overflow-hidden transition-all rounded-xl";

    const variantStyles = {
      default: "border border-gray-200 shadow-sm",
      elevated: "shadow-[0_8px_30px_rgb(0,0,0,0.04)]", // Premium shadow from Login
      flat: "border border-gray-100",
      interactive:
        "border border-gray-200 shadow-sm hover:border-secondary hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
    };

    const paddingStyles = {
      none: "p-0",
      small: "p-3",
      default: "p-4 md:p-6",
      large: "p-8",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
