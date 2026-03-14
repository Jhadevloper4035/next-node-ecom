"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/context/useAppState";

export default function CartLength() {
  const { cartProducts } = useAppState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{mounted ? cartProducts.length : 0}</>;
}
