import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
        aria-disabled={currentPage === 1}
      >
        <Button variant="secondary" disabled={currentPage === 1}>
          {dictionary.common.previous}
        </Button>
      </Link>
      <span className="text-sm text-slate-600">
        {dictionary.common.page} {formatNumber(currentPage, locale)} {dictionary.common.of}{" "}
        {formatNumber(totalPages, locale)}
      </span>
      <Link
        href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}
        aria-disabled={currentPage === totalPages}
      >
        <Button variant="secondary" disabled={currentPage === totalPages}>
          {dictionary.common.next}
        </Button>
      </Link>
    </div>
  );
}
