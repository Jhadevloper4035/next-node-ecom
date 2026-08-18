"use client";
import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Checkout from "@/components/otherPages/Checkout";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const user = useSelector((state) => state.auth.user);
  const isInitialLoading = useSelector((state) => state.ui.isInitialLoading);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInitialLoading) return;
    if (user) {
      setIsLoading(false);
    } else {
      router.replace("/login");
    }
  }, [isInitialLoading, router, user]);

  if (isLoading) {
    return (
      <>
        {/* <Topbar6 bgColor="bg-main" />
         */}
        <div
          style={{
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Checkout />
      <Footer1 />
    </>
  );
}
