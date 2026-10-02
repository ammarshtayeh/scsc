import { StoreShell } from "@/components/store/store-shell";
import { PageHero } from "@/components/ui/page-hero";
import { getAllProducts } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const dictionary = getServerDictionary();
  return buildPageMetadata({
    title: dictionary.nav.store,
    description: dictionary.store.description,
    path: "/store"
  });
}

export default async function StorePage() {
  const dictionary = getServerDictionary();
  const products = await getAllProducts();

  return (
    <>
      <PageHero title={dictionary.store.title} description={dictionary.store.description} />
      <StoreShell products={products} />
    </>
  );
}
