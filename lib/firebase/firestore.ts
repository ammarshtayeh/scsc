"use client";

import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import type { CartItem } from "@/types";

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

export async function cancelEventRegistration(eventId: string, userId: string) {
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

    if (!registrationSnap.exists()) {
      throw new Error("You are not registered for this event.");
    }

    const eventData = (eventSnap.data() || {}) as {
      registeredCount?: number;
    };
    const registeredCount = Number(eventData.registeredCount || 0);

    transaction.delete(registrationRef);
    transaction.update(eventRef, {
      registeredCount: Math.max(0, registeredCount - 1)
    });
    const currentUserData = (userSnap.data() || {}) as {
      registeredEventIds?: string[];
    };
    transaction.set(
      userRef,
      {
        registeredEventIds: (currentUserData.registeredEventIds || []).filter(
          (registeredEventId) => registeredEventId !== eventId
        ),
        lastEventCancellationAt: new Date().toISOString()
      },
      { merge: true }
    );
  });

  return { success: true };
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
