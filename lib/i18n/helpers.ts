import type {
  ArticleCategory,
  MembershipStatus,
  OrderStatus,
  ProductCategory,
  Role
} from "@/types";
import type { AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function translateArticleCategory(category: ArticleCategory, locale: AppLocale) {
  return getDictionary(locale).categories.article[category];
}

export function translateProductCategory(category: ProductCategory, locale: AppLocale) {
  return getDictionary(locale).categories.product[category];
}

export function translateEventTag(tag: string, locale: AppLocale) {
  const dictionary = getDictionary(locale);
  return dictionary.categories.tags[tag as keyof typeof dictionary.categories.tags] || tag;
}

export function translateRole(role: Role, locale: AppLocale) {
  return getDictionary(locale).categories.roles[role];
}

export function translateBoardRole(role: string, locale: AppLocale) {
  const dictionary = getDictionary(locale);
  return (
    dictionary.categories.boardRoles[
      role as keyof typeof dictionary.categories.boardRoles
    ] || role
  );
}

export function translateMembershipStatus(status: MembershipStatus, locale: AppLocale) {
  return getDictionary(locale).categories.membershipStatus[status];
}

export function translateOrderStatus(status: OrderStatus, locale: AppLocale) {
  return getDictionary(locale).categories.orderStatus[status];
}
