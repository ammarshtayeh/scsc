import { StoreShell } from "@/components/store/store-shell";
import { StoreSpotlight } from "@/components/store/store-spotlight";
import { PageHero } from "@/components/ui/page-hero";
import { getAllProducts, getHomePageSettings } from "@/lib/firebase/queries";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const [products, homeSettings] = await Promise.all([getAllProducts(), getHomePageSettings()]);
  const storeEyebrow =
    homeSettings?.storeEyebrow || (locale === "ar" ? "واجهة الشركاء" : "Partner showcase");
  const storeTitle = homeSettings?.storeTitle || dictionary.store.title;
  const storeDescription = homeSettings?.storeDescription || dictionary.store.description;
  const storePerks =
    homeSettings?.storePerks?.length
      ? homeSettings.storePerks
      : locale === "ar"
        ? [
            "إبراز منتجات الشركات الشريكة ضمن تجربة شراء مرتبة",
            "توضيح قيمة العضوية عبر السعر والمزايا",
            "دعم الطلب النقدي عند التسليم بخطوات بسيطة"
          ]
        : [
            "A cleaner shopping experience for partner products",
            "Clearer member value through pricing and perks",
            "Simple cash-on-delivery checkout"
          ];
  const storeCtaLabel =
    homeSettings?.storeCtaLabel || (locale === "ar" ? "ابدأ التسوق" : "Start shopping");
  const storeCtaHref = homeSettings?.storeCtaHref || "#store-grid";

  return (
    <>
      <PageHero
        eyebrow={dictionary.store.eyebrow}
        title={dictionary.store.title}
        description={dictionary.store.description}
      />
      <StoreSpotlight
        eyebrow={storeEyebrow}
        title={storeTitle}
        description={storeDescription}
        ctaLabel={storeCtaLabel}
        ctaHref={storeCtaHref}
        perks={storePerks}
      />
      <StoreShell products={products} />
    </>
  );
}
