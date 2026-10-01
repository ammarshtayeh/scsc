import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { getServerLocale } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/page-metadata";

const LAST_UPDATED = "2026-09-30";
const CONTACT_EMAIL = "scsc@najah.edu";

const content = {
  ar: {
    eyebrow: "الخصوصية",
    title: "سياسة الخصوصية وشروط الاستخدام",
    description:
      "كيف تجمع جمعية مستحضرات التجميل والعناية بالبشرة في جامعة النجاح بياناتك وتستخدمها وتحميها.",
    updated: "آخر تحديث",
    sections: [
      {
        heading: "من نحن",
        body: [
          "هذا الموقع هو المنصة الرسمية لجمعية مستحضرات التجميل والعناية بالبشرة (SCSC-NNU)، وهي جمعية طلابية في جامعة النجاح الوطنية. الجمعية هي الجهة المسؤولة عن البيانات التي تُجمع عبر الموقع."
        ]
      },
      {
        heading: "البيانات التي نجمعها",
        body: [
          "بيانات الحساب والعضوية: الاسم، البريد الإلكتروني، رقم الهاتف، الرقم الجامعي، التخصص، والسنة الدراسية.",
          "بيانات الطلبات من المتجر: المنتجات المطلوبة وبيانات التواصل والتوصيل اللازمة لإتمام الطلب.",
          "طلبات التوظيف: السيرة الذاتية وأي معلومات تضيفها عند التقديم على وظيفة.",
          "رسائل التواصل: الاسم والبريد الإلكتروني ونص الرسالة.",
          "التسجيل في الفعاليات وسجل الحضور عند مسح بطاقة العضوية."
        ]
      },
      {
        heading: "كيف نستخدم البيانات",
        body: [
          "لإدارة العضوية وإصدار بطاقة العضوية الرقمية والتحقق منها.",
          "لتنظيم الفعاليات وتأكيد التسجيل والحضور.",
          "لمعالجة طلبات المتجر والتواصل بخصوصها.",
          "للرد على رسائلك واستفساراتك.",
          "لا نبيع بياناتك ولا نستخدمها لأغراض إعلانية."
        ]
      },
      {
        heading: "مع من نشارك البيانات",
        body: [
          "طلب التوظيف وسيرتك الذاتية يطّلع عليها فقط صاحب الوظيفة (الشركة الشريكة أو الجمعية) وإدارة الجمعية.",
          "طلبات المتجر يطّلع عليها الشركة البائعة للمنتج بالقدر اللازم لتجهيز الطلب وتوصيله.",
          "تُخزَّن البيانات على خدمات Google Firebase السحابية المستخدمة لتشغيل الموقع."
        ]
      },
      {
        heading: "ملفات تعريف الارتباط (Cookies)",
        body: [
          "نستخدم ملفات ضرورية فقط: ملف لإبقائك مسجّل الدخول، وملف لحفظ اللغة التي اخترتها. لا نستخدم ملفات تتبّع إعلانية."
        ]
      },
      {
        heading: "حقوقك",
        body: [
          `يمكنك في أي وقت طلب الاطلاع على بياناتك أو تصحيحها أو حذف حسابك وبياناتك، بمراسلتنا على ${CONTACT_EMAIL}.`
        ]
      },
      {
        heading: "شروط الاستخدام",
        body: [
          "باستخدامك للموقع توافق على تقديم معلومات صحيحة، وعلى عدم إساءة استخدام الموقع أو محاولة الوصول إلى حسابات أو بيانات لا تخصك.",
          "بطاقة العضوية شخصية ولا يجوز مشاركتها. يحق للجمعية تعليق أي حساب يخالف هذه الشروط.",
          "المنتجات والوظائف المعروضة من الشركات الشريكة هي مسؤولية تلك الشركات، والجمعية وسيط لتسهيل الوصول إليها."
        ]
      },
      {
        heading: "التواصل",
        body: [`لأي سؤال حول الخصوصية: ${CONTACT_EMAIL}`]
      }
    ]
  },
  en: {
    eyebrow: "Privacy",
    title: "Privacy Policy and Terms of Use",
    description:
      "How the Society of Cosmetics and Skin Care at An-Najah National University collects, uses, and protects your data.",
    updated: "Last updated",
    sections: [
      {
        heading: "Who we are",
        body: [
          "This website is the official platform of the Society of Cosmetics and Skin Care (SCSC-NNU), a student society at An-Najah National University. The society is responsible for the data collected through this site."
        ]
      },
      {
        heading: "Data we collect",
        body: [
          "Account and membership data: name, email, phone number, student ID, specialization, and study year.",
          "Store orders: ordered products and the contact and delivery details needed to complete the order.",
          "Job applications: your CV and any details you add when applying.",
          "Contact messages: your name, email, and message.",
          "Event registrations and attendance records when your membership card is scanned."
        ]
      },
      {
        heading: "How we use it",
        body: [
          "To manage memberships and issue and verify the digital membership card.",
          "To organize events and confirm registration and attendance.",
          "To process store orders and contact you about them.",
          "To reply to your messages and questions.",
          "We do not sell your data or use it for advertising."
        ]
      },
      {
        heading: "Who we share it with",
        body: [
          "Your job application and CV are visible only to the job owner (a partner company or the society) and society administrators.",
          "Store orders are visible to the selling company only as needed to prepare and deliver the order.",
          "Data is stored on Google Firebase cloud services, which run this website."
        ]
      },
      {
        heading: "Cookies",
        body: [
          "We use essential cookies only: one to keep you signed in and one to remember your language. We do not use advertising trackers."
        ]
      },
      {
        heading: "Your rights",
        body: [
          `You can ask to access, correct, or delete your account and data at any time by emailing ${CONTACT_EMAIL}.`
        ]
      },
      {
        heading: "Terms of use",
        body: [
          "By using this site you agree to provide accurate information and not to misuse the site or try to access accounts or data that are not yours.",
          "Membership cards are personal and must not be shared. The society may suspend accounts that break these terms.",
          "Products and jobs listed by partner companies are the responsibility of those companies; the society facilitates access to them."
        ]
      },
      {
        heading: "Contact",
        body: [`For any privacy question: ${CONTACT_EMAIL}`]
      }
    ]
  }
} as const;

export function generateMetadata() {
  const copy = content[getServerLocale()];
  return buildPageMetadata({ title: copy.title, description: copy.description, path: "/privacy" });
}

export default function PrivacyPage() {
  const copy = content[getServerLocale()];

  return (
    <>
      <PageHero eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-8">
          <p className="text-xs text-slate-500">
            {copy.updated}: {LAST_UPDATED}
          </p>
          {copy.sections.map((section) => (
            <div key={section.heading} className="space-y-3">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">{section.heading}</h2>
              {section.body.length > 1 ? (
                <ul className="list-disc space-y-2 ps-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body[0]}</p>
              )}
            </div>
          ))}
        </Card>
      </section>
    </>
  );
}
