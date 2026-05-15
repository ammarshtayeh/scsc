"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Monitor, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallButton({
  className,
  fullWidth = false
}: {
  className?: string;
  fullWidth?: boolean;
}) {
  const { dictionary } = useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isInstallSupported, setIsInstallSupported] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/.test(userAgent);

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setOpenGuide(false);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsInstallSupported(true);
    };

    setInstalled(mediaQuery.matches);
    setIsIos(isiOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsInstallSupported(isMobileDevice);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || !isInstallSupported) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setOpenGuide(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void handleInstall()}
        className={fullWidth ? `w-full ${className ?? ""}`.trim() : className}
      >
        <Download className="h-4 w-4" />
        <span>{dictionary.nav.installApp}</span>
      </Button>

      <AnimatePresence>
        {openGuide ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-brand-night/60 p-4 sm:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-md rounded-[28px] border border-white/15 bg-brand-background p-5 shadow-[0_28px_70px_rgba(0,0,0,0.35)] dark:bg-brand-night"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.26em] text-brand-accent-strong">
                    {dictionary.nav.installGuideEyebrow}
                  </p>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
                    {dictionary.nav.installGuideTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-brand-mist">
                    {isIos
                      ? dictionary.nav.installAppIosHint
                      : isAndroid
                        ? dictionary.nav.installAppAndroidHint
                        : dictionary.nav.installAppUnavailableHint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenGuide(false)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-primary dark:text-brand-mist dark:hover:bg-white/10 dark:hover:text-brand-ink"
                  aria-label={dictionary.nav.closeInstallGuide}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-brand-primary/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-accent/15 p-2 text-brand-accent-strong dark:text-[#f5d669]">
                      {isIos ? <Share className="h-4 w-4" /> : isAndroid ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-semibold text-brand-primary dark:text-brand-ink">
                      {isIos
                        ? dictionary.nav.installGuideIosTitle
                        : isAndroid
                          ? dictionary.nav.installGuideAndroidTitle
                          : dictionary.nav.installGuideDesktopTitle}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-brand-mist">
                    {isIos
                      ? dictionary.nav.installGuideIosSteps
                      : isAndroid
                        ? dictionary.nav.installGuideAndroidSteps
                        : dictionary.nav.installGuideDesktopSteps}
                  </p>
                </div>

                {!isIos ? (
                  <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/10 p-4 text-sm leading-6 text-brand-primary dark:text-brand-ink">
                    {dictionary.nav.installGuideTip}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="accent" size="sm" onClick={() => setOpenGuide(false)}>
                  {dictionary.nav.closeInstallGuide}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
