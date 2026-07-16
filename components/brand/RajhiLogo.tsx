import Image from "next/image";

/**
 * Al Rajhi Bank official logo.
 * Used only next to Rajhi-specific things: the connect-Rajhi row and the Rajhi account row.
 */
export function RajhiLogo({
  height = 22,
  variant = "color",
  className = "",
}: {
  height?: number;
  variant?: "color" | "white";
  className?: string;
}) {
  // Source SVG viewBox — use a square container
  const width = height;
  return (
    <Image
      src="/brand/rajhi-logo.svg"
      alt="مصرف الراجحي"
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
