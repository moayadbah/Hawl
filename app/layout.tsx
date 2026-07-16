import type { Metadata, Viewport } from "next";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

// We import the FA CSS ourselves; stop the component from injecting it again
// (prevents the flash-of-huge-icons during SSR).
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "حَوْل",
  description:
    "حَوْل تربط حساباتك البنكية عبر المصرفية المفتوحة السعودية، تتتبع بلوغ النصاب واكتمال الحول الهجري، وتحسب زكاتك بدقة مع عرض المصدر الشرعي.",
};

export const viewport: Viewport = {
  themeColor: "#002134",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
