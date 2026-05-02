"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";

interface Slide {
  image: string;
  title: string;
  caption: string;
}

interface ImageSliderProps {
  slides: Slide[];
}

export function ImageSlider({ slides }: ImageSliderProps) {
  const { direction } = useLocale();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[index];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/50 shadow-soft dark:border-white/10 dark:bg-brand-surface/70 sm:rounded-[32px]">
      <div className="relative h-[290px] sm:h-[360px] lg:h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.image}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <SmartImage
              src={activeSlide.image}
              alt={activeSlide.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 50vw"
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-primary/88 via-brand-primary/58 to-transparent px-5 pb-5 pt-10 text-white sm:p-6">
        <h3 className="font-heading text-xl font-semibold sm:text-2xl">{activeSlide.title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">{activeSlide.caption}</p>
        {slides.length > 1 ? (
          <div className="mt-4 flex items-center gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.image}
                type="button"
                aria-label={`Slide ${slideIndex + 1}`}
                onClick={() => setIndex(slideIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  slideIndex === index ? "w-7 bg-brand-accent" : "w-2.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
        <Button
          variant="secondary"
          size="sm"
          className="h-9 w-9 rounded-full px-0 sm:h-10 sm:w-10"
          onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
        >
          {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
        <Button
          variant="secondary"
          size="sm"
          className="h-9 w-9 rounded-full px-0 sm:h-10 sm:w-10"
          onClick={() => setIndex((index + 1) % slides.length)}
        >
          {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
