"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useLocale } from "@/hooks/useLocale";

export function ThemeSwitcher() {
    const { setTheme, theme, systemTheme } = useTheme();
    const { dictionary } = useLocale();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/10 bg-white/70 text-brand-primary/70 opacity-50 shadow-card dark:border-white/10 dark:bg-brand-surface/80 dark:text-brand-ink/70">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 dark:scale-0" />
                <span className="sr-only">{dictionary.common.toggleTheme}</span>
            </button>
        );
    }

    const currentTheme = theme === "system" ? systemTheme : theme;

    return (
        <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/10 bg-white/78 text-brand-text shadow-card hover:bg-brand-sky hover:text-brand-primary dark:border-white/10 dark:bg-brand-surface/84 dark:text-brand-ink dark:hover:bg-[#17273f] dark:hover:text-brand-accent transition-colors transition-transform active:scale-95"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{dictionary.common.toggleTheme}</span>
        </button>
    );
}
