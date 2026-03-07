"use client";
import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header2";
import Topbar6 from "@/components/headers/Topbar6";
import Wishlist from "@/components/otherPages/Wishlist";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function WishListPage() {
  const { token } = useSelector((state) => state.auth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      // Redirect to login if not authenticated
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [token, router]);

  if (isLoading) {
    return (
      <>
        {/* <Topbar6 bgColor="bg-main" /> */}
        <Header2 />
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
    <ProtectedRoute>
      <Wishlist />
      <Footer1 />
    </ProtectedRoute>
  );
}
