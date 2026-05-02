import { LoginForm } from "@/components/auth/login-form";
import { PageHero } from "@/components/ui/page-hero";
import { getServerDictionary } from "@/lib/i18n/server";

export default function LoginPage() {
  const dictionary = getServerDictionary();

  return (
    <>
      <PageHero
        eyebrow={dictionary.auth.loginEyebrow}
        title={dictionary.auth.loginTitle}
        description={dictionary.auth.loginDescription}
      />
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </>
  );
}
