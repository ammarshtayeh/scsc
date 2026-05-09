"use client";

import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { MEMBER_DISCOUNT_RATE } from "@/lib/constants";
import { db } from "@/lib/firebase/firebase";
import type { CartItem, Order, OrderLineItem, Product } from "@/types";

function requireDb() {
  if (!db) {
    throw new Error("Firebase Firestore is not configured.");
  }

  return db;
}

export async function registerForEvent(eventId: string, userId: string) {
  const database = requireDb();

  await runTransaction(database, async (transaction) => {
    const eventRef = doc(database, "events", eventId);
    const registrationRef = doc(database, "events", eventId, "registrations", userId);
    const userRef = doc(database, "users", userId);

    const [eventSnap, registrationSnap, userSnap] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(registrationRef),
      transaction.get(userRef)
    ]);

    if (!eventSnap.exists()) {
      throw new Error("Event not found.");
    }

    if (registrationSnap.exists()) {
      throw new Error("You are already registered for this event.");
    }

    const eventData = (eventSnap.data() || {}) as {
      capacity?: number;
      registeredCount?: number;
    };
    const capacity = Number(eventData.capacity || 0);
    const registeredCount = Number(eventData.registeredCount || 0);

    if (registeredCount >= capacity) {
      throw new Error("This event is full.");
    }

    transaction.set(registrationRef, {
      userId,
      createdAt: serverTimestamp()
    });
    transaction.update(eventRef, {
      registeredCount: registeredCount + 1
    });
    const currentUserData = (userSnap.data() || {}) as {
      registeredEventIds?: string[];
    };
    const registeredEventIds = Array.from(
      new Set([...(currentUserData.registeredEventIds || []), eventId])
    );
    transaction.set(
      userRef,
      {
        registeredEventIds,
        lastEventRegistrationAt: new Date().toISOString()
      },
      { merge: true }
    );
  });

  return { success: true };
}

export async function isUserRegisteredForEvent(eventId: string, userId: string) {
  const database = requireDb();
  const snapshot = await getDoc(doc(database, "events", eventId, "registrations", userId));
  return snapshot.exists();
}

export function subscribeToCart(userId: string, callback: (items: CartItem[]) => void) {
  const database = requireDb();

  const cartRef = doc(database, "carts", userId);
  return onSnapshot(cartRef, (snapshot) => {
    const data = snapshot.data();
    callback((data?.items as CartItem[]) || []);
  });
}

export async function addCartItem(userId: string, productId: string, quantity = 1) {
  const current = await getCartItems(userId);
  const existing = current.find((item) => item.productId === productId);

  const next = existing
    ? current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    : [...current, { productId, quantity }];

  const database = db;

  if (!database) {
    throw new Error("Firebase Firestore is not configured.");
  }

  await setDoc(
    doc(database, "carts", userId),
    {
      userId,
      updatedAt: serverTimestamp(),
      items: next
    },
    { merge: true }
  );
  return next;
}

export async function updateCartItem(userId: string, productId: string, quantity: number) {
  const current = await getCartItems(userId);
  const next = current
    .map((item) => (item.productId === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  const database = db;

  if (!database) {
    throw new Error("Firebase Firestore is not configured.");
  }

  await setDoc(
    doc(database, "carts", userId),
    {
      userId,
      updatedAt: serverTimestamp(),
      items: next
    },
    { merge: true }
  );
  return next;
}

export async function removeCartItem(userId: string, productId: string) {
  return updateCartItem(userId, productId, 0);
}

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const database = db;

  if (!database) {
    throw new Error("Firebase Firestore is not configured.");
  }

  const snapshot = await getDoc(doc(database, "carts", userId));
  const data = snapshot.data() as { items?: CartItem[] } | undefined;
  return data?.items || [];
}

export async function checkoutCodOrder(
  userId: string,
  products: Product[],
  useMemberPricing = true,
  membershipDiscountRate = MEMBER_DISCOUNT_RATE
) {
  const cartItems = await getCartItems(userId);

  if (!cartItems.length) {
    throw new Error("Your cart is empty.");
  }

  const database = db;

  if (!database) {
    throw new Error("Firebase Firestore is not configured.");
  }

  const userSnap = await getDoc(doc(database, "users", userId));
  const userData = userSnap.data() as
    | {
        membershipStatus?: string;
        membershipExpiresAt?: string;
      }
    | undefined;
  const hasActiveMembership =
    (userData?.membershipStatus || "active") === "active" &&
    (!userData?.membershipExpiresAt || new Date(userData.membershipExpiresAt).getTime() >= Date.now());
  const shouldUseMemberPricing = useMemberPricing && hasActiveMembership;

  const lineItems: OrderLineItem[] = cartItems.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new Error("One of the selected products is unavailable.");
    }

    return {
      productId: product.id,
      name: product.name,
      price: shouldUseMemberPricing ? product.memberPrice ?? product.price : product.price,
      quantity: item.quantity
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = shouldUseMemberPricing
    ? Number((subtotal * membershipDiscountRate).toFixed(2))
    : 0;
  const total = Number((subtotal - discount).toFixed(2));

  const orderId = uuidv4();

  await runTransaction(database, async (transaction) => {
    for (const lineItem of lineItems) {
      const productRef = doc(database, "products", lineItem.productId);
      const productSnap = await transaction.get(productRef);
      const stock = Number(productSnap.data()?.stock || 0);

      if (!productSnap.exists() || stock < lineItem.quantity) {
        throw new Error(`${lineItem.name} does not have enough stock.`);
      }

      transaction.update(productRef, {
        stock: stock - lineItem.quantity
      });
    }

    transaction.set(doc(database, "orders", orderId), {
      userId,
      createdAt: serverTimestamp(),
      status: "pending",
      subtotal,
      discount,
      total,
      items: lineItems
    });

    transaction.delete(doc(database, "carts", userId));
  });

  return {
    id: orderId,
    subtotal,
    discount,
    total
  };
}
