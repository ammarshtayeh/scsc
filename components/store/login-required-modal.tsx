"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useLocale } from "@/hooks/useLocale";

export function LoginRequiredModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useLocale();
  const pathname = usePathname() || "/store";
  const redirect = encodeURIComponent(pathname);
  const isArabic = locale === "ar";

  return (
    <Modal open={open} onClose={onClose} title={isArabic ? "يرجى تسجيل الدخول" : "Please sign in"}>
      <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">
        {isArabic
          ? "لإضافة المنتجات إلى السلة وإتمام الطلب، سجّل دخولك أو أنشئ حساباً جديداً."
          : "Sign in or create an account to add products to your cart and place an order."}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href={`/auth/login?redirect=${redirect}`}>
          <Button className="w-full">{isArabic ? "تسجيل الدخول" : "Sign in"}</Button>
        </Link>
        <Link href={`/auth/signup?redirect=${redirect}`}>
          <Button variant="secondary" className="w-full">
            {isArabic ? "إنشاء حساب" : "Create account"}
          </Button>
        </Link>
      </div>
    </Modal>
  );
}
