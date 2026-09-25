import type { Metadata } from "next";
import { Inter, Noto_Sans_Tamil, Fraunces, Catamaran } from "next/font/google";
import SessionProviderClient from "@/components/session-provider-client";
import "./globals.css";

// Typography pairing: Fraunces (elegant heritage-appropriate serif, headings
// only) + Inter (Latin/English body) + Noto Sans Tamil (Tamil script,
// required for correct Tamil rendering — a functional requirement, not just
// visual). Fraunces was previously deferred; now added per the homepage
// redesign brief calling for "elegant serif typography suitable for
// heritage/spiritual content."
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});
const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
});
// Tamil display face for headings (DESIGN_SYSTEM.md §3), paired with
// Fraunces so EN and TA headings carry the same weight on the page.
const catamaran = Catamaran({
  variable: "--font-tamil-display",
  subsets: ["tamil"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Sri Gurusamy Sri Ananthammal Temple",
  description:
    "Sri Gurusamy Sri Ananthammal Temple, Thirumangalam Kottai Street, Madurai District, Tamil Nadu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${notoSansTamil.variable} ${catamaran.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-(--color-background) text-(--color-text-primary)">
        <SessionProviderClient>{children}</SessionProviderClient>
      </body>
    </html>
  );
}
