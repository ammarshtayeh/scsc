import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getServerDictionary } from "@/lib/i18n/server";

export default function NotFound() {
  const dictionary = getServerDictionary();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
          404
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold text-brand-primary">
          {dictionary.notFound.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {dictionary.notFound.description}
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button>{dictionary.notFound.backHome}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
