import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  rounded?: "normal" | "full";
  className?: string;
  isLoading?: boolean;
}
