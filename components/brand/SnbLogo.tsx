import Image from "next/image";

/**
 * Saudi National Bank (SNB / الأهلي) official logo.
 * Used only next to SNB-specific things: the connect-SNB row and the SNB account row.
 */
export function SnbLogo({
  height = 22,
  variant = "color",
  className = "",
}: {
  height?: number;
  variant?: "color" | "white";
  className?: string;
}) {
  const width = height;
  return (
    <Image
      src="/brand/snb-logo.svg"
      alt="البنك الأهلي السعودي"
      width={width}
      height={height}
      className={className}
      style={
        variant === "white"
          ? { filter: "brightness(0) invert(1)" }
          : undefined
      }
      priority
    />
  );
}
