import { SignupForm } from "@/components/auth/signup-form";
import { PageHero } from "@/components/ui/page-hero";
import { getServerDictionary } from "@/lib/i18n/server";

export default function SignupPage() {
  const dictionary = getServerDictionary();

  return (
    <>
      <PageHero
        eyebrow={dictionary.auth.signupEyebrow}
        title={dictionary.auth.signupTitle}
        description={dictionary.auth.signupDescription}
      />
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6 lg:px-8">
        <SignupForm />
      </div>
    </>
  );
}
