import { StoreShell } from "@/components/store/store-shell";
import { PageHero } from "@/components/ui/page-hero";
import { getAllProducts } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const dictionary = getServerDictionary();
  const products = await getAllProducts();

  return (
    <>
      <PageHero
        eyebrow={dictionary.store.eyebrow}
        title={dictionary.store.title}
        description={dictionary.store.description}
      />
      <StoreShell products={products} />
    </>
  );
}
