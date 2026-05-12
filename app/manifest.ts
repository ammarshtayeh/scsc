import type { MetadataRoute } from "next";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { getServerLocale } from "@/lib/i18n/server";

export default function manifest(): MetadataRoute.Manifest {
  const locale = getServerLocale();
  const dictionary = getDictionary(locale);

  return {
    name: dictionary.site.title,
    short_name: "SCSC-NNU",
    description: dictionary.site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f7fb",
    theme_color: "#15345b",
    lang: locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
