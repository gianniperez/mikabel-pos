"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import type { SearchBarProps } from "./SearchBar.types";

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    { className, containerClassName, placeholder = "Buscar...", ...props },
    ref,
  ) => {
    return (
      <div className={clsx("relative w-full", containerClassName)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className={clsx(
            "w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm font-display",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
