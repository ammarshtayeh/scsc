import type { ArticleCategory, ProductCategory, Role } from "@/types";

export const SITE_NAME = "Cosmetics & Skin Care Association";
export const SITE_SHORT_NAME = "SCSC";

export const SITE_DESCRIPTION =
  "Official website for the Cosmetics & Skin Care Association at An-Najah National University.";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/education", label: "Education" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
  { href: "/store", label: "Store" }
] as const;

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  "Skin Care",
  "Makeup",
  "Hair Care",
  "Others"
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Skin Care",
  "Body Care",
  "Makeup",
  "Masks"
];

export const ROLES: Role[] = ["admin", "moderator", "user"];

export const MEMBER_DISCOUNT_RATE = 0.12;
export const STORE_CURRENCY = "ILS";
export const LOGIN_LOCK_DURATION_MINUTES = 15;
export const LOGIN_LOCK_MAX_ATTEMPTS = 5;
