import Image from "next/image";

/**
 * Alinma's official logo. Per brand rules, this appears ONLY next to
 * Alinma-specific things: the "connect Alinma" action, the Alinma account
 * row, and the "pay via Alinma" button. It is NOT the app's logo.
 */
export function AlinmaLogo({
  height = 22,
  variant = "color",
  className = "",
}: {
  height?: number;
  variant?: "color" | "white";
  className?: string;
}) {
  // Source SVG is 180x69 (aspect ≈ 2.61)
  const width = Math.round((180 / 69) * height);
  return (
    <Image
      src="/brand/alinma-logo.svg"
      alt="مصرف الإنماء"
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
