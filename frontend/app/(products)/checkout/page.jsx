"use client";
import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Checkout from "@/components/otherPages/Checkout";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
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
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container">
          <h3 className="heading text-center">Check Out</h3>
          <ul className="breadcrumbs d-flex align-items-center justify-content-center">
            <li>
              <Link className="link" href={`/`}>
                Homepage
              </Link>
            </li>
            <li>
              <i className="icon-arrRight" />
            </li>
            <li>
              <Link className="link" href={`/shop-default-grid`}>
                Shop
              </Link>
            </li>
            <li>
              <i className="icon-arrRight" />
            </li>
            <li>View Cart</li>
          </ul>
        </div>
      </div>
      <Checkout />
      <Footer1 />
    </>
  );
}
