import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Manrope,
  Noto_Kufi_Arabic,
  Tajawal
} from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getDirection } from "@/lib/i18n/config";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"]
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"]
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-kufi-arabic",
  weight: ["500", "600", "700"]
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-tajawal",
  weight: ["400", "500", "700"]
});

export function generateMetadata(): Metadata {
  try {
    const dictionary = getServerDictionary();
    const locale = getServerLocale();
    const metadataBase = new URL(getSiteUrl());
    const fullTitle = `${dictionary.site.title} | ${dictionary.site.university}`;

    return {
      metadataBase,
      title: {
        default: fullTitle,
        template: `%s | ${dictionary.site.title}`
      },
      description: dictionary.site.description,
      applicationName: dictionary.site.title,
      manifest: "/manifest.webmanifest",
      openGraph: {
        type: "website",
        siteName: dictionary.site.title,
        title: fullTitle,
        description: dictionary.site.description,
        locale: locale === "ar" ? "ar_PS" : "en_US",
        alternateLocale: locale === "ar" ? ["en_US"] : ["ar_PS"]
      },
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description: dictionary.site.description
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: dictionary.site.title
      },
      icons: {
        icon: [
          { url: "/favicon.svg", type: "image/svg+xml" },
          { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
        ],
        apple: "/apple-touch-icon.png"
      }
    };
  } catch {
    return {
      title: "SCSC-NNU",
      description: "Society of Cosmetics and Skin Care"
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale();
  const direction = getDirection(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${manrope.variable} ${notoKufiArabic.variable} ${tajawal.variable} antialiased selection:bg-brand-accent/30 selection:text-brand-primary transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>
              <ToastProvider>
                <PwaRegister />
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ToastProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
