"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addCartItem,
  checkoutCodOrder,
  removeCartItem,
  subscribeToCart,
  updateCartItem
} from "@/lib/firebase/firestore";
import type { CartItem, OrderDeliveryInfo, Product } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export function useCart(products: Product[], useMemberPricing = true) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCart(user.id, (nextItems) => {
      setItems(nextItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const decoratedItems = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) {
          return null;
        }

        return {
          ...item,
          product,
          lineTotal:
            (useMemberPricing ? product.memberPrice ?? product.price : product.price) *
            item.quantity
        };
      })
      .filter(
        (
          item
        ): item is CartItem & {
          product: Product;
          lineTotal: number;
        } => Boolean(item)
      );
  }, [items, products, useMemberPricing]);

  const total = useMemo(
    () => decoratedItems.reduce((sum, item) => sum + (item?.lineTotal || 0), 0),
    [decoratedItems]
  );

  async function addProduct(productId: string) {
    if (!user) {
      throw new Error("Please login first.");
    }

    const product = products.find((entry) => entry.id === productId);
    if (!product || product.stock <= 0) {
      throw new Error("This product is currently out of stock.");
    }

    await addCartItem(user.id, productId, 1);
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (!user) {
      throw new Error("Please login first.");
    }
    if (quantity <= 0) {
      await removeCartItem(user.id, productId);
      return;
    }
    await updateCartItem(user.id, productId, quantity);
  }

  async function checkout(deliveryInfo?: OrderDeliveryInfo) {
    if (!user) {
      throw new Error("Please login first.");
    }
    return checkoutCodOrder(user.id, products, useMemberPricing, undefined, deliveryInfo);
  }

  return {
    items: decoratedItems,
    total,
    rawItems: items,
    loading,
    addProduct,
    updateQuantity,
    checkout
  };
}
