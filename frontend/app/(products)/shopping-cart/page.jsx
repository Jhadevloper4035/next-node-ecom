import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import RecentProducts from "@/components/otherPages/RecentProducts";
import ShopCart from "@/components/otherPages/ShopCart";
import Link from "next/link";
import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = {
  title:
    "Shopping Cart || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function ShopingCartPage() {
  return (
    <>
      <ProtectedRoute>
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container">
          <h3 className="heading text-center">Shopping Cart</h3>
          <ul className="breadcrumbs d-flex align-items-center justify-content-center">
            <li>
              <Link className="link" href={`/`}>
                Home
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
            <li>Shopping Cart</li>
          </ul>
        </div>
      </div>

      <ShopCart />
      <RecentProducts />
      <Footer1 />
      </ProtectedRoute>
    </>
  );
}
