import { OrderDetailShell } from "@/components/profile/order-detail-shell";
import { PageHero } from "@/components/ui/page-hero";
import { getServerDictionary } from "@/lib/i18n/server";

export default function ProfileOrderPage({
  params
}: {
  params: { id: string };
}) {
  const dictionary = getServerDictionary();

  return (
    <>
      <PageHero
        eyebrow={dictionary.profile.orderHistory}
        title={params.id}
        description={dictionary.profile.title}
      />
      <OrderDetailShell orderId={params.id} />
    </>
  );
}
