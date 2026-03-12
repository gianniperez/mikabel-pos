"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Mail, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import type { InputProps } from "./Input.types";

export const Input = forwardRef<
  HTMLInputElement | HTMLSelectElement,
  InputProps
>(
  (
    {
      label,
      error,
      icon,
      iconPosition = "right",
      type = "text",
      options = [],
      className,
      containerClassName,
      labelRightContent,
      helperText,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const isSelect = type === "select";
    const isNumber = type === "number";
    const isEmail = type === "email";

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    // Default icon processing
    let renderedIcon = icon;
    if (!icon && isEmail) {
      renderedIcon = <Mail className="w-5 h-5 text-gray-400" />;
      if (iconPosition === undefined) iconPosition = "right"; // default for email in LoginForm
    }

    const baseInputStyles = clsx(
      "w-full p-3 border rounded-mikabel focus:outline-none focus:ring-2 transition-shadow",
      error
        ? "border-red-500 focus:ring-red-200"
        : "border-gray-200 focus:ring-primary focus:border-transparent",
      renderedIcon && !isSelect && iconPosition === "left" && "pl-10",
      renderedIcon && !isSelect && iconPosition === "right" && "pr-10",
      !renderedIcon && !isSelect && "px-3",
      isPassword && "pr-10",
      isSelect && "appearance-none pr-10 px-3",
      // Remove arrows for number input
      isNumber &&
        "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      className,
    );

    return (
      <div className={clsx("w-full flex-col flex", containerClassName)}>
        {(label || labelRightContent) && (
          <div className="flex items-center justify-between mb-1">
            {label && (
              <label className="block text-sm font-semibold text-gray-700">
                {label}
                {props.required && (
                  <span className="text-danger ml-1" title="Campo obligatorio">
                    *
                  </span>
                )}
              </label>
            )}
            {labelRightContent}
          </div>
        )}
        <div className="relative">
          {renderedIcon && !isSelect && iconPosition === "left" && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {renderedIcon}
            </div>
          )}

          {isSelect ? (
            <div className="relative">
              <select
                ref={ref as React.Ref<HTMLSelectElement>}
                className={clsx(baseInputStyles, "bg-white cursor-pointer")}
                {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <>
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type={inputType}
                className={clsx("bg-gray-50", baseInputStyles)}
                {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
              />
              {renderedIcon &&
                !isSelect &&
                iconPosition === "right" &&
                !isPassword && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    {renderedIcon}
                  </div>
                )}
            </>
          )}

          {isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye className="w-5 h-5 cursor-pointer" />
              ) : (
                <EyeOff className="w-5 h-5 cursor-pointer" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[#EF4444] text-xs font-medium mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-gray-400 text-[11px] font-medium mt-1 leading-tight">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
