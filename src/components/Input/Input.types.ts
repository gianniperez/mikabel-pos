import { InputHTMLAttributes, ReactNode } from "react";

export interface InputOption {
  value: string | number;
  label: string;
}

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>,
  "type"
> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  type?: InputHTMLAttributes<HTMLInputElement>["type"] | "select";
  options?: InputOption[];
  containerClassName?: string;
  labelRightContent?: ReactNode;
  helperText?: string;
}
