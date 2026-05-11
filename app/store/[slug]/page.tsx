import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/store/product-detail-client";
import { PageHero } from "@/components/ui/page-hero";
import { getAllProducts, getProductBySlug } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const dictionary = getServerDictionary();
  const [product, allProducts] = await Promise.all([
    getProductBySlug(params.slug),
    getAllProducts()
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow={dictionary.store.detailEyebrow}
        title={product.name}
        description={product.description}
      />
      <ProductDetailClient product={product} allProducts={allProducts} />
    </>
  );
}
