"use client";

import { useAppState } from "@/context/useAppState";

export default function CartLength() {
  const { cartProducts } = useAppState();
  return <>{cartProducts.length}</>;
}
