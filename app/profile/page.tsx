import { ProfileShell } from "@/components/profile/profile-shell";
import { PageHero } from "@/components/ui/page-hero";
import { getServerDictionary } from "@/lib/i18n/server";

export default function ProfilePage() {
  const dictionary = getServerDictionary();

  return (
    <>
      <PageHero
        eyebrow={dictionary.profile.eyebrow}
        title={dictionary.profile.title}
        description={dictionary.profile.description}
      />
      <ProfileShell view="dashboard" />
    </>
  );
}
