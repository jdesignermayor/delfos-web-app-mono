import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

/**
 * Poppins is the alternative / display face. It is not a variable font on
 * Google Fonts, so the weights we actually use are listed explicitly.
 * `next/font/google` downloads and self-hosts it at build time — no runtime
 * request to Google, and `display: "swap"` keeps text visible while it loads.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * SF Pro is Apple's proprietary UI font and is not distributed by Google
 * Fonts, so it is served from the OS via the system stack in globals.css
 * (`--font-sans`). That costs zero bytes and never causes layout shift.
 * Geist Mono still backs the `--font-mono` token for code / tabular figures.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Delfos — Vivienda nueva para comprar y arrendar",
    template: "%s · Delfos",
  },
  description:
    "Delfos reúne vivienda nueva y usada para comprar o arrendar en Colombia, y permite a constructoras y propietarios publicar y administrar sus inmuebles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
