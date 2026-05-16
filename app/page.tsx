import { EventsPreview } from "@/components/sections/events-preview";
import { HeroSection } from "@/components/sections/hero-section";
import { MembershipPromo } from "@/components/sections/membership-promo";
import { NewsSection } from "@/components/sections/news-section";
import { PartnersShowcase } from "@/components/sections/partners-showcase";
import { StoreSpotlight } from "@/components/store/store-spotlight";
import { getHomePageSettings, getLatestArticles, getUpcomingEvents } from "@/lib/firebase/queries";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const [articles, events, homeSettings] = await Promise.all([
    getLatestArticles(3),
    getUpcomingEvents(4),
    getHomePageSettings()
  ]);
  const slideImages = [
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80"
  ];
  const slides = dictionary.home.slides.map((slide, index) => {
    const savedSlide = homeSettings?.slides[index];

    return {
      image: savedSlide?.image || slideImages[index],
      title: savedSlide?.title || slide.title,
      caption: savedSlide?.caption || slide.caption
    };
  });
  const partnerFallbacks =
    locale === "ar"
      ? [
          {
            name: "شركاء الجمال والعناية",
            tagline: "مساحات تعاون مع شركات تقدّم منتجات وتجارب وأنشطة موجّهة للطلاب.",
            logo: slideImages[0]
          },
          {
            name: "مختبرات ومورّدون",
            tagline: "فرص ربط الطلبة بالقطاع من خلال منتجات تعليمية وعروض مدروسة.",
            logo: slideImages[1]
          },
          {
            name: "علامات داعمة للمجتمع",
            tagline: "شراكات تعطي قيمة حقيقية للأعضاء وتدعم رسالة الجمعية داخل الجامعة.",
            logo: slideImages[2]
          }
        ]
      : [
          {
            name: "Beauty and care partners",
            tagline: "Collaboration spaces with companies offering products, campaigns, and student-facing experiences.",
            logo: slideImages[0]
          },
          {
            name: "Labs and suppliers",
            tagline: "Practical bridges between students and the sector through curated offers and learning products.",
            logo: slideImages[1]
          },
          {
            name: "Brands supporting the community",
            tagline: "Partnerships that create real member value while reinforcing the association mission.",
            logo: slideImages[2]
          }
        ];
  const partners = homeSettings?.partners?.length ? homeSettings.partners : partnerFallbacks;
  const partnerEyebrow =
    homeSettings?.partnerEyebrow || (locale === "ar" ? "شركاؤنا" : "Our partners");
  const partnerTitle =
    homeSettings?.partnerTitle ||
    (locale === "ar"
      ? "شراكات تعطي المتجر معنى وقيمة"
      : "Partnerships that give the store purpose");
  const partnerDescription =
    homeSettings?.partnerDescription ||
    (locale === "ar"
      ? "المنصة ليست مجرد متجر. هي واجهة تجمع بين المجتمع الطلابي والعلامات والشركات التي تريد الوصول للطلبة بشكل منظم وموثوق."
      : "This is more than a storefront. It is a curated bridge between the student community and partner brands looking for trusted campus visibility.");
  const storeEyebrow =
    homeSettings?.storeEyebrow || (locale === "ar" ? "متجر الجمعية" : "Association store");
  const storeTitle =
    homeSettings?.storeTitle ||
    (locale === "ar"
      ? "منتجات مختارة بعناية ومزايا أوضح للأعضاء"
      : "Curated products with clearer member value");
  const storeDescription =
    homeSettings?.storeDescription ||
    (locale === "ar"
      ? "اعرضوا منتجات الشركات الشريكة ضمن تجربة أنظف، أوضح، ومربوطة بهوية الجمعية ونشاطها داخل الجامعة."
      : "Showcase partner products inside a cleaner shopping experience tied to the association identity and campus activity.");
  const storePerks =
    homeSettings?.storePerks?.length
      ? homeSettings.storePerks
      : locale === "ar"
        ? [
            "تمييز واضح لمنتجات الشركاء داخل المتجر",
            "قيمة إضافية للأعضاء عبر التسعير والمزايا",
            "واجهة أقوى للشركات داخل المجتمع الطلابي"
          ]
        : [
            "Clearer visibility for partner products",
            "Member value through pricing and perks",
            "A stronger brand presence inside the student community"
          ];
  const storeCtaLabel =
    homeSettings?.storeCtaLabel || (locale === "ar" ? "ادخل إلى المتجر" : "Explore the store");
  const storeCtaHref = homeSettings?.storeCtaHref || "/store";
  return (
    <>
      <HeroSection
        slides={slides}
        featuredEvent={events[0]}
        featuredVideo={homeSettings?.featuredVideo}
      />
      <MembershipPromo />
      <NewsSection articles={articles} />
      <PartnersShowcase
        eyebrow={partnerEyebrow}
        title={partnerTitle}
        description={partnerDescription}
        partners={partners}
      />
      <StoreSpotlight
        eyebrow={storeEyebrow}
        title={storeTitle}
        description={storeDescription}
        ctaLabel={storeCtaLabel}
        ctaHref={storeCtaHref}
        perks={storePerks}
      />
      <EventsPreview events={events} />
    </>
  );
}
