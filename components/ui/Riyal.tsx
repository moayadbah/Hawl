import React from "react";

const SAR_GLYPH = "Ʀ"; // mapped to the Saudi Riyal symbol in `sarfont`

export function formatAmount(value: number, decimals?: number): string {
  const hasFraction = decimals !== undefined ? decimals > 0 : value % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFraction ? (decimals ?? 2) : 0,
    maximumFractionDigits: decimals ?? 2,
  }).format(value);
}

/** A money value with the official Saudi Riyal symbol (sarfont). */
export function Riyal({
  value,
  decimals,
  className = "",
  symbolClassName = "",
}: {
  value: number;
  decimals?: number;
  className?: string;
  symbolClassName?: string;
}) {
  return (
    <span className={`tnum inline-flex items-baseline gap-1 ${className}`}>
      <span>{formatAmount(value, decimals)}</span>
      <span
        className={`riyal-symbol ${symbolClassName}`}
        style={{ fontSize: "0.82em" }}
        aria-label="ريال سعودي"
      >
        {SAR_GLYPH}
      </span>
    </span>
  );
}
