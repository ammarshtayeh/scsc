export type Role = "admin" | "moderator" | "user";

export type ArticleCategory = "Skin Care" | "Makeup" | "Hair Care" | "Others";
export type ProductCategory = "Skin Care" | "Body Care" | "Makeup" | "Masks";
export type OrderStatus = "pending" | "confirmed" | "processing" | "delivered";
export type MembershipStatus = "active" | "expired" | "pendingRenewal";
export type MemberGrade = "first" | "second";

export interface ArticleReference {
  label: string;
  url: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  coverImage: string;
  category: ArticleCategory;
  publishedAt: string;
  authorName: string;
  approved: boolean;
  references: ArticleReference[];
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string[];
  coverImage: string;
  startsAt: string;
  venue: string;
  capacity: number;
  registeredCount: number;
  tags: string[];
  isFeatured?: boolean;
}

export interface ArchivedEvent {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string[];
  eventDate: string;
  venue: string;
  images: string[];
  tags: string[];
  createdAt?: string;
  createdBy?: string;
  createdByRole?: Role;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  displayName?: string;
  email?: string;
  registeredAt?: string;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
}

export interface HomeSlide {
  image: string;
  title: string;
  caption: string;
}

export interface PartnerHighlight {
  name: string;
  tagline: string;
  logo: string;
  url?: string;
}

export interface HomeFeaturedVideo {
  enabled: boolean;
  url: string;
  title?: string;
  description?: string;
}

export interface HomePageSettings {
  slides: HomeSlide[];
  partnerEyebrow?: string;
  partnerTitle?: string;
  partnerDescription?: string;
  partners?: PartnerHighlight[];
  featuredVideo?: HomeFeaturedVideo;
  storeEyebrow?: string;
  storeTitle?: string;
  storeDescription?: string;
  storeCtaLabel?: string;
  storeCtaHref?: string;
  storePerks?: string[];
  updatedAt?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string[];
  price: number;
  memberPrice?: number;
  category: ProductCategory;
  company: string;
  stock: number;
  images: string[];
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDeliveryInfo {
  contactName: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  items: OrderLineItem[];
  deliveryInfo?: OrderDeliveryInfo;
}

export interface BoardMember {
  id: string;
  year: string;
  name: string;
  role: string;
  order?: number;
  image: string;
  bio: string;
}

export interface UserProfile {
  id: string;
  membershipId?: string;
  displayName: string;
  email: string;
  role: Role;
  phone?: string;
  studentId?: string;
  specialization?: string;
  memberGrade?: MemberGrade;
  company?: string;
  photoURL?: string;
  membershipStatus: MembershipStatus;
  membershipExpiresAt?: string;
  joinedAt: string;
  qrToken?: string;
  savedArticleIds?: string[];
  registeredEventIds?: string[];
  activeQrSessionId?: string | null;
  activeQrSessionExpiresAt?: string | null;
  lastQrIssuedAt?: string | null;
  lastQrScanAt?: string | null;
  discountRate?: number;
}

export interface DashboardStats {
  totalUsers: number;
  upcomingEvents: number;
  totalOrders: number;
  registeredCompanies: number;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

export interface AppSessionUser {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  photoURL?: string;
}

export interface MembershipQrSession {
  qrValue: string;
  sessionId: string;
  memberId: string;
  fullName: string;
  membershipExpiryDate: string;
  expiresAt: string;
  issuedAt: string;
  refreshIntervalSeconds: number;
}

export interface VerifyMembershipResponse {
  valid: boolean;
  reason?: "expired" | "duplicate" | "invalid" | "inactive" | "stale";
  memberId?: string;
  memberName?: string;
  membershipExpiryDate?: string;
  scannedAt?: string;
  newTokenIssued?: boolean;
}
