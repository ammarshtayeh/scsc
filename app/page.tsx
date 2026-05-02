import { EventsPreview } from "@/components/sections/events-preview";
import { HeroSection } from "@/components/sections/hero-section";
import { MembershipPromo } from "@/components/sections/membership-promo";
import { NewsSection } from "@/components/sections/news-section";
import { getLatestArticles, getUpcomingEvents } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const dictionary = getServerDictionary();
  const [articles, events] = await Promise.all([getLatestArticles(3), getUpcomingEvents(4)]);
  const slideImages = [
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80"
  ];
  const slides = dictionary.home.slides.map((slide, index) => ({
    image: slideImages[index],
    title: slide.title,
    caption: slide.caption
  }));

  return (
    <>
      <HeroSection slides={slides} featuredEvent={events[0]} />
      <MembershipPromo />
      <NewsSection articles={articles} />
      <EventsPreview events={events} />
    </>
  );
}
