"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
  const { pushToast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isInstallSupported, setIsInstallSupported] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/.test(userAgent);

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsInstallSupported(true);
    };

    setInstalled(mediaQuery.matches);
    setIsIos(isiOSDevice);
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
      pushToast(
        isIos ? dictionary.nav.installAppIosHint : dictionary.nav.installAppUnavailableHint,
        "info"
      );
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
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void handleInstall()}
      className={fullWidth ? `w-full ${className ?? ""}`.trim() : className}
    >
      <Download className="h-4 w-4" />
      <span>{dictionary.nav.installApp}</span>
    </Button>
  );
}
