import { cache } from "react";

import { ProductDetailClient } from "@/components/store/product-detail-client";
import { ProductDetailResolver } from "@/components/store/product-detail-resolver";
import { PageHero } from "@/components/ui/page-hero";
import { getAllProducts, getProductBySlug } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

const loadProduct = cache(getProductBySlug);

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const dictionary = getServerDictionary();
  const product = await loadProduct(params.slug);

  return buildPageMetadata({
    title: product?.name || dictionary.nav.store,
    description: product?.description || dictionary.store.description,
    path: `/store/${encodeURIComponent(params.slug)}`,
    image: product?.images?.[0]
  });
}

export default async function ProductDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const dictionary = getServerDictionary();
  const [product, allProducts] = await Promise.all([
    loadProduct(params.slug),
    getAllProducts()
  ]);

  if (!product) {
    return (
      <>
        <PageHero
          eyebrow={dictionary.store.detailEyebrow}
          title={dictionary.store.title}
          description={dictionary.store.description}
        />
        <ProductDetailResolver slug={params.slug} />
      </>
    );
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
