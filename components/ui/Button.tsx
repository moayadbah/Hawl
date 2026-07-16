import React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "lavender" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-alinma-navy text-white hover:bg-[#012a44] shadow-soft disabled:opacity-40",
  secondary:
    "bg-white text-alinma-navy border border-alinma-navy/20 hover:border-alinma-navy/50 hover:bg-alinma-cream/40",
  lavender:
    "bg-alinma-lavender text-white hover:brightness-105 shadow-soft disabled:opacity-40",
  ghost: "bg-transparent text-alinma-navy hover:bg-alinma-cream/50",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
