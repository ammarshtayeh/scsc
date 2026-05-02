import { ProfileShell } from "@/components/profile/profile-shell";
import { PageHero } from "@/components/ui/page-hero";
import { getServerDictionary } from "@/lib/i18n/server";

export default function MembershipCardPage() {
  const dictionary = getServerDictionary();

  return (
    <>
      <PageHero
        eyebrow={dictionary.profile.membershipCardEyebrow}
        title={dictionary.profile.membershipCardTitle}
        description={dictionary.profile.membershipCardDescription}
      />
      <ProfileShell view="membership-card" />
    </>
  );
}
