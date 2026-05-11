import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const firestoreSource = readFileSync(join(process.cwd(), "lib/firebase/firestore.ts"), "utf8");
const useCartSource = readFileSync(join(process.cwd(), "hooks/useCart.ts"), "utf8");
const dashboardSource = readFileSync(
  join(process.cwd(), "components/dashboard/dashboard-shell.tsx"),
  "utf8"
);
const functionsSource = readFileSync(join(process.cwd(), "functions/src/index.ts"), "utf8");

describe("Store enterprise QA contracts", () => {
  it("keeps checkout atomic: reads cart, validates stock, creates order, decrements products, and clears cart", () => {
    const checkoutBlock = firestoreSource.slice(
      firestoreSource.indexOf("export async function checkoutCodOrder"),
      firestoreSource.length
    );

    expect(checkoutBlock).toContain("const cartItems = await getCartItems(userId);");
    expect(checkoutBlock).toContain("if (!cartItems.length)");
    expect(checkoutBlock).toContain("throw new Error(\"Your cart is empty.\");");
    expect(checkoutBlock).toContain("await runTransaction(database, async (transaction) =>");
    expect(checkoutBlock).toContain("const productSnaps = await Promise.all(");
    expect(checkoutBlock).toContain("productRefs.map((productRef) => transaction.get(productRef))");
    expect(checkoutBlock).toContain("stock < lineItem.quantity");
    expect(checkoutBlock).toContain("transaction.update(productRefs[index]");
    expect(checkoutBlock).toContain("transaction.set(doc(database, \"orders\", orderId)");
    expect(checkoutBlock).toContain("status: \"pending\"");
    expect(checkoutBlock).toContain("transaction.delete(doc(database, \"carts\", userId));");
  });

  it("rejects invalid product IDs and trims delivery info before order persistence", () => {
    expect(firestoreSource).toContain("throw new Error(\"One of the selected products is unavailable.\");");
    expect(firestoreSource).toContain("contactName: deliveryInfo.contactName.trim()");
    expect(firestoreSource).toContain("phone: deliveryInfo.phone.trim()");
    expect(firestoreSource).toContain("address: deliveryInfo.address.trim()");
    expect(firestoreSource).toContain("notes: deliveryInfo.notes?.trim() || \"\"");
  });

  it("persists carts under the authenticated owner document and supports remove/quantity updates", () => {
    expect(firestoreSource).toContain("doc(database, \"carts\", userId)");
    expect(firestoreSource).toContain("userId,");
    expect(firestoreSource).toContain("updatedAt: serverTimestamp()");
    expect(firestoreSource).toContain("items: next");
    expect(useCartSource).toContain("if (quantity <= 0)");
    expect(useCartSource).toContain("await removeCartItem(user.id, productId);");
  });

  it("exposes admin product create/edit/delete controls and store-facing image data", () => {
    const productBlock = dashboardSource.slice(
      dashboardSource.indexOf("<Card id=\"products\""),
      dashboardSource.indexOf("<Card id=\"board-members\"")
    );

    expect(productBlock).toContain("upsertProductAdmin");
    expect(productBlock).toContain("deleteProductAdmin(product.id)");
    expect(productBlock).toContain("name: productForm.name");
    expect(productBlock).toContain("stock: Number(productForm.stock)");
    expect(productBlock).toContain("images,");
    expect(productBlock).toContain("id: product.id");
    expect(productBlock).toContain("getAll(\"imageFiles\")");
    expect(productBlock).toContain("getTexts(formData, \"images\")");
    expect(productBlock).toContain("getTexts(formData, \"removeImages\")");
    expect(productBlock).toContain("uploadDashboardImage(\"products\", file)");
    expect(productBlock).toContain("images: [...imageUrls, ...uploadedImages]");
  });

  it("requires elevated callable auth for product admin APIs", () => {
    const upsertProductBlock = functionsSource.slice(
      functionsSource.indexOf("export const upsertProduct"),
      functionsSource.indexOf("export const deleteProduct")
    );
    const deleteProductBlock = functionsSource.slice(
      functionsSource.indexOf("export const deleteProduct"),
      functionsSource.indexOf("export const upsertBoardMember")
    );

    expect(upsertProductBlock).toContain("requireAdminOrModerator(request);");
    expect(upsertProductBlock).toContain("if (!name || price <= 0 || stock < 0)");
    expect(deleteProductBlock).toContain("requireAdminOrModerator(request);");
    expect(deleteProductBlock).toContain("if (!id)");
  });
});

describe("Events enterprise QA contracts", () => {
  it("keeps event registration atomic with duplicate and capacity checks", () => {
    const registerBlock = firestoreSource.slice(
      firestoreSource.indexOf("export async function registerForEvent"),
      firestoreSource.indexOf("export async function isUserRegisteredForEvent")
    );

    expect(registerBlock).toContain("await runTransaction(database, async (transaction) =>");
    expect(registerBlock).toContain("const registrationRef = doc(database, \"events\", eventId, \"registrations\", userId);");
    expect(registerBlock).toContain("if (registrationSnap.exists())");
    expect(registerBlock).toContain("You are already registered for this event.");
    expect(registerBlock).toContain("if (registeredCount >= capacity)");
    expect(registerBlock).toContain("This event is full.");
    expect(registerBlock).toContain("transaction.update(eventRef");
    expect(registerBlock).toContain("registeredCount: registeredCount + 1");
    expect(registerBlock).toContain("registeredEventIds");
  });

  it("keeps cancellation atomic and prevents negative registered counts", () => {
    const cancelBlock = firestoreSource.slice(
      firestoreSource.indexOf("export async function cancelEventRegistration"),
      firestoreSource.indexOf("export function subscribeToCart")
    );

    expect(cancelBlock).toContain("await runTransaction(database, async (transaction) =>");
    expect(cancelBlock).toContain("if (!registrationSnap.exists())");
    expect(cancelBlock).toContain("You are not registered for this event.");
    expect(cancelBlock).toContain("transaction.delete(registrationRef);");
    expect(cancelBlock).toContain("registeredCount: Math.max(0, registeredCount - 1)");
    expect(cancelBlock).toContain(".filter(");
  });

  it("exposes admin event create/edit/delete and cleanup-registration controls", () => {
    const eventBlock = dashboardSource.slice(
      dashboardSource.indexOf("<Card id=\"events\""),
      dashboardSource.indexOf("<Card id=\"registrants\"")
    );

    expect(eventBlock).toContain("upsertEventAdmin");
    expect(eventBlock).toContain("deleteEventAdmin(event.id)");
    expect(eventBlock).toContain("deleteEventAdmin(event.id, true)");
    expect(eventBlock).toContain("id: event.id");
    expect(eventBlock).toContain("registeredCount: event.registeredCount");
    expect(eventBlock).toContain("capacity: getNumber(formData, \"capacity\", event.capacity)");
  });

  it("requires elevated callable auth for event admin APIs and protects registered events from unsafe deletion", () => {
    const upsertEventBlock = functionsSource.slice(
      functionsSource.indexOf("export const upsertEvent"),
      functionsSource.indexOf("export const deleteEvent")
    );
    const deleteEventBlock = functionsSource.slice(
      functionsSource.indexOf("export const deleteEvent"),
      functionsSource.indexOf("export const upsertProduct")
    );

    expect(upsertEventBlock).toContain("requireAdminOrModerator(request);");
    expect(upsertEventBlock).toContain("if (!title || !startsAt || capacity <= 0)");
    expect(deleteEventBlock).toContain("requireAdminOrModerator(request);");
    expect(deleteEventBlock).toContain("if (!registrationsSnap.empty && !cleanupRegistrations)");
    expect(deleteEventBlock).toContain("FieldValue.arrayRemove(id)");
  });

  it("exposes admin home page slider management and protects it with admin callable auth", () => {
    const homeBlock = dashboardSource.slice(
      dashboardSource.indexOf("<Card id=\"home\""),
      dashboardSource.indexOf("<Card id=\"events\"")
    );
    const upsertHomeSettingsBlock = functionsSource.slice(
      functionsSource.indexOf("export const upsertHomeSettings"),
      functionsSource.indexOf("export const upsertProduct")
    );

    expect(homeBlock).toContain("upsertHomeSettingsAdmin");
    expect(homeBlock).toContain("uploadDashboardImage(\"home\", imageFile)");
    expect(homeBlock).toContain("homeSlideImage");
    expect(homeBlock).toContain("homeSlideTitle");
    expect(homeBlock).toContain("homeSlideCaption");
    expect(upsertHomeSettingsBlock).toContain("requireAdmin(request);");
    expect(upsertHomeSettingsBlock).toContain("db.collection(\"siteSettings\").doc(\"home\")");
  });
});
