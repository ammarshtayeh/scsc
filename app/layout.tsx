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
  const dictionary = getServerDictionary();

  return {
    title: {
      default: dictionary.site.title,
      template: `%s | ${dictionary.site.title}`
    },
    description: dictionary.site.description,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: dictionary.site.title
    },
    icons: {
      icon: "/favicon.svg",
      apple: "/favicon.svg"
    }
  };
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
