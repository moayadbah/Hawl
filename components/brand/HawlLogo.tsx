import Image from "next/image";

/**
 * Hawl's own identity mark — the official crescent-in-cycle SVG
 * (`public/brand/Hawl_logo.svg`), used at small/medium sizes across the app
 * (header, footer, auth screen, sources page). Square asset, so width=height.
 */
export function HawlMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/Hawl_logo.svg"
      alt="حَوْل"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

/**
 * The full hero lockup (mark + "حَوْل" wordmark baked into one vector,
 * `public/brand/First_page_logo.svg`) — used only on the welcome screen. Its
 * canvas has a solid white background matching the welcome hero card, so it
 * blends in seamlessly without cropping.
 */
export function HawlHeroMark({
  size = 320,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/First_page_logo.svg"
      alt="حَوْل"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export function HawlLogo({
  size = 40,
  withWordmark = true,
  tone = "navy",
  className = "",
}: {
  size?: number;
  withWordmark?: boolean;
  tone?: "navy" | "light";
  className?: string;
}) {
  const text = tone === "light" ? "text-white" : "text-alinma-navy";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <HawlMark size={size} />
      {withWordmark && (
        <span className={`font-sans font-bold tracking-tight ${text}`} style={{ fontSize: size * 0.62 }}>
          حَوْل
        </span>
      )}
    </span>
  );
}
