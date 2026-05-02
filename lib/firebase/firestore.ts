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

const LOCAL_CART_PREFIX = "scsc-cart";
const LOCAL_REGISTRATION_PREFIX = "scsc-registration";
const LOCAL_REGISTERED_EVENTS_PREFIX = "scsc-registered-events";
const LOCAL_ORDER_PREFIX = "scsc-orders";
const LOCAL_CART_UPDATED_EVENT = "scsc-local-cart-updated";

function localCartKey(userId: string) {
  return `${LOCAL_CART_PREFIX}:${userId}`;
}

function localRegistrationKey(eventId: string, userId: string) {
  return `${LOCAL_REGISTRATION_PREFIX}:${eventId}:${userId}`;
}

function localRegisteredEventsKey(userId: string) {
  return `${LOCAL_REGISTERED_EVENTS_PREFIX}:${userId}`;
}

function localOrderKey(userId: string) {
  return `${LOCAL_ORDER_PREFIX}:${userId}`;
}

function readLocalCart(userId: string): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(localCartKey(userId));
  return raw ? (JSON.parse(raw) as CartItem[]) : [];
}

function writeLocalCart(userId: string, items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localCartKey(userId), JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent(LOCAL_CART_UPDATED_EVENT, {
      detail: { userId, items }
    })
  );
}

function readLocalRegisteredEvents(userId: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(localRegisteredEventsKey(userId));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

function writeLocalRegisteredEvents(userId: string, eventIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localRegisteredEventsKey(userId), JSON.stringify(eventIds));
}

function readLocalOrders(userId: string): Order[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(localOrderKey(userId));
  return raw ? (JSON.parse(raw) as Order[]) : [];
}

function writeLocalOrders(userId: string, orders: Order[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localOrderKey(userId), JSON.stringify(orders));
}

export function getMockRegisteredEventIds(userId: string) {
  return readLocalRegisteredEvents(userId);
}

export function getMockOrdersForUser(userId: string) {
  return readLocalOrders(userId);
}

export async function registerForEvent(eventId: string, userId: string) {
  const database = db;

  if (!database) {
    const marker = localRegistrationKey(eventId, userId);
    if (window.localStorage.getItem(marker)) {
      throw new Error("You are already registered for this event.");
    }

    window.localStorage.setItem(marker, "true");
    writeLocalRegisteredEvents(
      userId,
      Array.from(new Set([...readLocalRegisteredEvents(userId), eventId]))
    );
    return { success: true, mock: true };
  }

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

export function subscribeToCart(userId: string, callback: (items: CartItem[]) => void) {
  const database = db;

  if (!database) {
    callback(readLocalCart(userId));

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== localCartKey(userId)) {
        return;
      }

      callback(readLocalCart(userId));
    };

    const handleLocalUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; items?: CartItem[] }>).detail;

      if (!detail || detail.userId !== userId) {
        return;
      }

      callback(detail.items || []);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOCAL_CART_UPDATED_EVENT, handleLocalUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        LOCAL_CART_UPDATED_EVENT,
        handleLocalUpdate as EventListener
      );
    };
  }

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
    writeLocalCart(userId, next);
    return next;
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
    writeLocalCart(userId, next);
    return next;
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
    return readLocalCart(userId);
  }

  const snapshot = await getDoc(doc(database, "carts", userId));
  const data = snapshot.data() as { items?: CartItem[] } | undefined;
  return data?.items || [];
}

export async function checkoutCodOrder(
  userId: string,
  products: Product[],
  membershipDiscountRate = MEMBER_DISCOUNT_RATE
) {
  const cartItems = await getCartItems(userId);

  if (!cartItems.length) {
    throw new Error("Your cart is empty.");
  }

  const lineItems: OrderLineItem[] = cartItems.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new Error("One of the selected products is unavailable.");
    }

    return {
      productId: product.id,
      name: product.name,
      price: product.memberPrice ?? product.price,
      quantity: item.quantity
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Number((subtotal * membershipDiscountRate).toFixed(2));
  const total = Number((subtotal - discount).toFixed(2));

  const database = db;

  if (!database) {
    const orderId = `mock-${uuidv4()}`;
    const mockOrder: Order = {
      id: orderId,
      userId,
      createdAt: new Date().toISOString(),
      status: "pending",
      subtotal,
      discount,
      total,
      items: lineItems
    };

    writeLocalOrders(userId, [mockOrder, ...readLocalOrders(userId)]);
    writeLocalCart(userId, []);
    return {
      id: orderId,
      subtotal,
      discount,
      total
    };
  }

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
