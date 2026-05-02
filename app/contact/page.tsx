import { ContactForm } from "@/components/contact/contact-form";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { getServerDictionary } from "@/lib/i18n/server";

export default function ContactPage() {
  const dictionary = getServerDictionary();

  return (
    <>
      <PageHero
        eyebrow={dictionary.contact.eyebrow}
        title={dictionary.contact.title}
        description={dictionary.contact.description}
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-4">
            <h2 className="font-heading text-3xl font-bold text-brand-primary">
              {dictionary.contact.cardTitle}
            </h2>
            <p className="text-sm leading-8 text-slate-600">{dictionary.contact.cardText}</p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>{dictionary.contact.emailLabel}: scsc@najah.edu</p>
              <p>{dictionary.contact.locationLabel}: {dictionary.contact.locationValue}</p>
              <p>{dictionary.contact.officeHoursLabel}: {dictionary.contact.officeHoursValue}</p>
            </div>
          </Card>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
