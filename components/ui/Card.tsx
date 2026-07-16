import React from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-alinma-navy/[0.06] bg-white shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
