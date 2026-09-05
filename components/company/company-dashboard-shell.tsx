"use client";

import Link from "next/link";
import {
  ClipboardList,
  ExternalLink,
  ImageUp,
  Briefcase,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  Save,
  Search,
  Sparkles,
  Store,
  Trash2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { JobsManagePanel } from "@/components/jobs/jobs-manage-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import { STORE_CURRENCY } from "@/lib/constants";
import {
  deleteProductAdmin,
  updateCompanyOrderFulfillment,
  upsertProductAdmin
} from "@/lib/firebase/functions";
import { uploadFileToStorage } from "@/lib/firebase/storage";
import { translateOrderStatus, translateProductCategory } from "@/lib/i18n/helpers";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import type { Job, JobApplication, Order, OrderStatus, Product, ProductCategory, UserProfile } from "@/types";

interface CompanyDashboardShellProps {
  company: UserProfile;
  initialProducts: Product[];
  initialOrders: Order[];
  initialJobs: Job[];
  initialApplications: JobApplication[];
}

const productCategories: ProductCategory[] = ["Skin Care", "Body Care", "Makeup", "Masks"];
const orderStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "delivered"];

export function CompanyDashboardShell({
  company,
  initialProducts,
  initialOrders,
  initialJobs,
  initialApplications
}: CompanyDashboardShellProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { pushToast } = useToast();

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "jobs">("products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Skin Care" as ProductCategory,
    price: "10",
    memberPrice: "9",
    discountPercent: "0",
    stock: "10",
    imageUrl: "",
    images: [] as string[],
    description: "",
    longDescription: "",
    featured: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const companyName = company.company || company.displayName || "Company Partner";
  const companyId = company.id;

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.stock > 0).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    const pendingOrders = orders.filter((order) => {
      const companyItems = order.items.filter((item) => item.companyId === companyId);
      const status = companyItems[0]?.fulfillmentStatus || order.status || "pending";
      return status === "pending" || status === "confirmed";
    }).length;
    return { total, inStock, outOfStock, pendingOrders, totalOrders: orders.length };
  }, [products, orders, companyId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
      if (selectedStockStatus === "inStock" && product.stock <= 0) return false;
      if (selectedStockStatus === "outOfStock" && product.stock > 0) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [products, selectedCategory, selectedStockStatus, searchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const companyItems = order.items.filter((item) => item.companyId === companyId);
      if (!companyItems.length) return false;
      if (orderStatusFilter === "all") return true;
      const status = companyItems[0]?.fulfillmentStatus || order.status;
      return status === orderStatusFilter;
    });
  }, [orders, companyId, orderStatusFilter]);

  function handleOpenAddModal() {
    setEditingProductId(null);
    setProductForm({
      name: "",
      category: "Skin Care",
      price: "10",
      memberPrice: "9",
      discountPercent: "0",
      stock: "10",
      imageUrl: "",
      images: [],
      description: "",
      longDescription: "",
      featured: false
    });
    setIsModalOpen(true);
  }

  function handleOpenEditModal(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      memberPrice: String(product.memberPrice ?? product.price),
      discountPercent: String(product.discountPercent ?? 0),
      stock: String(product.stock),
      imageUrl: "",
      images: product.images || [],
      description: product.description || "",
      longDescription: (product.longDescription || []).join("\n"),
      featured: Boolean(product.featured)
    });
    setIsModalOpen(true);
  }

  async function handleFileUpload(file: File) {
    try {
      setUploadingImage(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const url = await uploadFileToStorage(`images/products/${Date.now()}-${safeName}`, file);
      setProductForm((current) => ({ ...current, images: [...current.images, url] }));
      pushToast(locale === "ar" ? "تم رفع الصورة بنجاح" : "Image uploaded successfully", "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Upload failed", "error");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmitProduct(event: React.FormEvent) {
    event.preventDefault();
    const actionKey = editingProductId ? `edit-${editingProductId}` : "create-product";

    try {
      setLoadingAction(actionKey);
      const payload = {
        id: editingProductId || undefined,
        name: productForm.name.trim(),
        category: productForm.category,
        price: Number(productForm.price),
        memberPrice: Number(productForm.memberPrice),
        discountPercent: Number(productForm.discountPercent) || 0,
        stock: Number(productForm.stock),
        company: companyName,
        companyId: company.id,
        images: productForm.images,
        description: productForm.description.trim(),
        longDescription: productForm.longDescription
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        featured: productForm.featured
      };

      const result = await upsertProductAdmin(payload);
      const nextId = result.id || editingProductId || crypto.randomUUID();
      const nextProduct: Product = {
        id: nextId,
        slug: result.slug || nextId,
        name: payload.name,
        category: payload.category,
        price: payload.price,
        memberPrice: payload.memberPrice,
        discountPercent: payload.discountPercent,
        stock: payload.stock,
        company: payload.company,
        companyId: payload.companyId,
        images: payload.images,
        description: payload.description,
        longDescription: payload.longDescription,
        featured: payload.featured
      };

      setProducts((current) =>
        editingProductId
          ? current.map((entry) => (entry.id === editingProductId ? nextProduct : entry))
          : [nextProduct, ...current]
      );
      setIsModalOpen(false);
      pushToast(locale === "ar" ? "تم حفظ المنتج بنجاح" : "Product saved successfully", "success");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!window.confirm(locale === "ar" ? "هل تريد حذف هذا المنتج؟" : "Delete this product?")) {
      return;
    }

    try {
      setLoadingAction(`delete-${productId}`);
      await deleteProductAdmin(productId);
      setProducts((current) => current.filter((entry) => entry.id !== productId));
      pushToast(locale === "ar" ? "تم حذف المنتج" : "Product deleted", "success");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleUpdateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      setLoadingAction(`order-${orderId}`);
      const result = await updateCompanyOrderFulfillment({ id: orderId, status });
      setOrders((current) =>
        current.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            status: (result as { status?: OrderStatus }).status || status,
            items: order.items.map((item) =>
              item.companyId === companyId ? { ...item, fulfillmentStatus: status } : item
            )
          };
        })
      );
      pushToast(locale === "ar" ? "تم تحديث حالة التجهيز" : "Fulfillment status updated", "success");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Update failed", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-[#0f1b2e]/92 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-brand-primary/10 bg-brand-sky/50 text-2xl font-bold text-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-brand-ink">
              {company.photoURL ? (
                <SmartImage src={company.photoURL} alt={companyName} fill className="object-cover" />
              ) : (
                companyName[0]?.toUpperCase() || "C"
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl font-bold text-brand-primary dark:text-brand-ink sm:text-3xl">
                  {companyName}
                </h1>
                <Badge>{locale === "ar" ? "بوابة الشركاء" : "Partner Portal"}</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-brand-mist">
                {company.email} {company.phone ? `• ${company.phone}` : ""}
              </p>
              <p className="text-xs text-slate-500">
                {locale === "ar"
                  ? "أضيفوا منتجاتكم وتابعوا طلباتكم وجهّزوا البضاعة من هنا."
                  : "Manage your products, track orders, and fulfill your goods here."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs" target="_blank">
              <Button variant="secondary" size="sm">
                <Briefcase className="h-4 w-4" />
                {locale === "ar" ? "صفحة الوظائف" : "View Jobs"}
              </Button>
            </Link>
            <Link href="/store" target="_blank">
              <Button variant="secondary" size="sm">
                <Store className="h-4 w-4" />
                {locale === "ar" ? "معاينة المتجر" : "View Store"}
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                setActiveTab("products");
                handleOpenAddModal();
              }}
            >
              <Plus className="h-4 w-4" />
              {locale === "ar" ? "إضافة منتج" : "Add Product"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeTab === "products" ? "primary" : "secondary"}
          onClick={() => setActiveTab("products")}
        >
          <Package className="h-4 w-4" />
          {locale === "ar" ? "المنتجات" : "Products"}
        </Button>
        <Button
          size="sm"
          variant={activeTab === "orders" ? "primary" : "secondary"}
          onClick={() => setActiveTab("orders")}
        >
          <ClipboardList className="h-4 w-4" />
          {locale === "ar"
            ? `الطلبات (${formatNumber(stats.totalOrders, locale)})`
            : `Orders (${stats.totalOrders})`}
        </Button>
        <Button
          size="sm"
          variant={activeTab === "jobs" ? "primary" : "secondary"}
          onClick={() => setActiveTab("jobs")}
        >
          <Briefcase className="h-4 w-4" />
          {locale === "ar"
            ? `الوظائف (${formatNumber(initialJobs.length, locale)})`
            : `Jobs (${initialJobs.length})`}
        </Button>
      </div>

      {activeTab === "jobs" ? (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
              {locale === "ar" ? "وظائف شركتكم" : "Your company jobs"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-brand-mist">
              {locale === "ar"
                ? "انشروا وظائف، واستعرضوا طلبات المتقدمين مع السير الذاتية."
                : "Post openings and review applicant CVs and details."}
            </p>
          </div>
          <JobsManagePanel
            initialJobs={initialJobs}
            initialApplications={initialApplications}
            defaultCompanyName={companyName}
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-2xl bg-brand-primary/10 p-3 text-brand-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{locale === "ar" ? "المنتجات" : "Products"}</p>
            <p className="font-heading text-2xl font-bold text-brand-primary">
              {formatNumber(stats.total, locale)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{locale === "ar" ? "متوفر" : "In stock"}</p>
            <p className="font-heading text-2xl font-bold text-emerald-600">
              {formatNumber(stats.inStock, locale)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-600">
            <PackageX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{locale === "ar" ? "نفد" : "Out of stock"}</p>
            <p className="font-heading text-2xl font-bold text-rose-600">
              {formatNumber(stats.outOfStock, locale)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {locale === "ar" ? "بانتظار التجهيز" : "To fulfill"}
            </p>
            <p className="font-heading text-2xl font-bold text-amber-600">
              {formatNumber(stats.pendingOrders, locale)}
            </p>
          </div>
        </Card>
      </div>

      {activeTab === "products" ? (
        <Card className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-brand-primary">
                {locale === "ar" ? "منتجاتكم" : "Your products"}
              </h2>
              <p className="text-sm text-slate-500">
                {locale === "ar"
                  ? "المنتجات تظهر فورًا في المتجر باسم شركتكم."
                  : "Products appear immediately in the store under your company name."}
              </p>
            </div>
            <Button onClick={handleOpenAddModal}>
              <Plus className="h-4 w-4" />
              {locale === "ar" ? "إضافة منتج" : "Add product"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === "ar" ? "ابحث..." : "Search..."}
                className="w-full rounded-xl border border-brand-primary/10 py-2.5 pl-9 pr-4 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-brand-primary/10 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <option value="all">{locale === "ar" ? "كل التصنيفات" : "All categories"}</option>
              {productCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {translateProductCategory(cat, locale)}
                </option>
              ))}
            </select>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="rounded-xl border border-brand-primary/10 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <option value="all">{locale === "ar" ? "كل المخزون" : "All stock"}</option>
              <option value="inStock">{locale === "ar" ? "متوفر" : "In stock"}</option>
              <option value="outOfStock">{locale === "ar" ? "نفد" : "Out of stock"}</option>
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-primary/20 py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-brand-primary">
                {locale === "ar" ? "لا توجد منتجات" : "No products"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-brand-primary/10">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-brand-sky/40">
                      {product.images?.[0] ? (
                        <SmartImage src={product.images[0]} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-primary">{product.name}</p>
                      <p className="text-sm text-slate-500">
                        {translateProductCategory(product.category, locale)} •{" "}
                        {formatCurrency(product.price, STORE_CURRENCY, locale)} •{" "}
                        {formatNumber(product.stock, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/store/${product.slug}`} target="_blank">
                      <Button size="sm" variant="secondary">
                        <ExternalLink className="h-4 w-4" />
                        {locale === "ar" ? "عرض" : "View"}
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => handleOpenEditModal(product)}>
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={loadingAction === `delete-${product.id}`}
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {locale === "ar" ? "حذف" : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-brand-primary">
                {locale === "ar" ? "طلبات منتجاتكم" : "Orders for your products"}
              </h2>
              <p className="text-sm text-slate-500">
                {locale === "ar"
                  ? "طلبات تحتوي منتجات شركتكم فقط. حدّثوا حالة التجهيز بعد إعداد البضاعة."
                  : "Only orders with your products. Update fulfillment after preparing goods."}
              </p>
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="rounded-xl border border-brand-primary/10 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <option value="all">{locale === "ar" ? "كل الحالات" : "All statuses"}</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {translateOrderStatus(status, locale)}
                </option>
              ))}
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-primary/20 py-16 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-brand-primary">
                {locale === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const companyItems = order.items.filter((item) => item.companyId === companyId);
                const companySubtotal = companyItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                const currentStatus = companyItems[0]?.fulfillmentStatus || order.status;

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-brand-primary/10 bg-brand-sky/30 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-brand-primary">
                          {locale === "ar" ? "طلب" : "Order"} #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-slate-500">{formatDateTime(order.createdAt, locale)}</p>
                        <p className="mt-1 font-medium text-brand-primary">
                          {formatCurrency(companySubtotal, STORE_CURRENCY, locale)}
                        </p>
                      </div>
                      <select
                        value={currentStatus}
                        disabled={loadingAction === `order-${order.id}`}
                        onChange={(e) =>
                          void handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="rounded-xl border border-brand-primary/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#101a2b]"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {translateOrderStatus(status, locale)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      {companyItems.map((item) => (
                        <p key={`${order.id}-${item.productId}`}>
                          {item.name} × {formatNumber(item.quantity, locale)} —{" "}
                          {formatCurrency(item.price * item.quantity, STORE_CURRENCY, locale)}
                        </p>
                      ))}
                    </div>
                    {order.deliveryInfo ? (
                      <div className="mt-4 rounded-xl border border-brand-primary/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-[#101a2b]">
                        <p className="font-medium text-brand-primary">
                          {locale === "ar" ? "التوصيل" : "Delivery"}
                        </p>
                        <p>
                          {order.deliveryInfo.contactName} • {order.deliveryInfo.phone}
                        </p>
                        <p>{order.deliveryInfo.address}</p>
                        {order.deliveryInfo.notes ? <p className="text-slate-500">{order.deliveryInfo.notes}</p> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-brand-primary">
                {editingProductId
                  ? locale === "ar"
                    ? "تعديل المنتج"
                    : "Edit product"
                  : locale === "ar"
                    ? "إضافة منتج"
                    : "Add product"}
              </h3>
              <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmitProduct}>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span>{locale === "ar" ? "اسم المنتج" : "Product name"}</span>
                <input
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm((c) => ({ ...c, name: e.target.value }))}
                  className="rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{locale === "ar" ? "التصنيف" : "Category"}</span>
                <select
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm((c) => ({ ...c, category: e.target.value as ProductCategory }))
                  }
                  className="rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                >
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {translateProductCategory(cat, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>{locale === "ar" ? "المخزون" : "Stock"}</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={productForm.stock}
                  onChange={(e) => setProductForm((c) => ({ ...c, stock: e.target.value }))}
                  className="rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{locale === "ar" ? "السعر" : "Price"}</span>
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm((c) => ({ ...c, price: e.target.value }))}
                  className="rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{locale === "ar" ? "سعر الأعضاء" : "Member price"}</span>
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={productForm.memberPrice}
                  onChange={(e) => setProductForm((c) => ({ ...c, memberPrice: e.target.value }))}
                  className="rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span>{locale === "ar" ? "الوصف" : "Description"}</span>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm((c) => ({ ...c, description: e.target.value }))}
                  className="min-h-20 rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                />
              </label>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">{locale === "ar" ? "الصور" : "Images"}</p>
                <div className="flex flex-wrap gap-2">
                  {productForm.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl">
                      <SmartImage src={image} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
                        onClick={() =>
                          setProductForm((c) => ({
                            ...c,
                            images: c.images.filter((_, i) => i !== index)
                          }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm((c) => ({ ...c, imageUrl: e.target.value }))}
                    placeholder={locale === "ar" ? "رابط صورة" : "Image URL"}
                    className="flex-1 rounded-xl border border-brand-primary/10 px-3 py-2 dark:border-white/10 dark:bg-[#101a2b]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!productForm.imageUrl.trim()) return;
                      setProductForm((c) => ({
                        ...c,
                        images: [...c.images, c.imageUrl.trim()],
                        imageUrl: ""
                      }));
                    }}
                  >
                    {locale === "ar" ? "إضافة رابط" : "Add URL"}
                  </Button>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-primary/10 px-3 py-2 text-sm dark:border-white/10">
                    <ImageUp className="h-4 w-4" />
                    {uploadingImage
                      ? locale === "ar"
                        ? "جارٍ الرفع..."
                        : "Uploading..."
                      : locale === "ar"
                        ? "رفع"
                        : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm((c) => ({ ...c, featured: e.target.checked }))}
                />
                {locale === "ar" ? "منتج مميز" : "Featured"}
              </label>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  loading={
                    loadingAction === "create-product" ||
                    Boolean(editingProductId && loadingAction === `edit-${editingProductId}`)
                  }
                >
                  <Save className="h-4 w-4" />
                  {locale === "ar" ? "حفظ" : "Save"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
