import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Products1 from "@/components/products/Products1";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "All Products | Premium Furniture Online",
  description: "Browse all premium furniture from Curve & Comfort, including sofas, beds, tables, chairs, wardrobes, kitchen furniture, and wall decor.",
  alternates: {
    canonical: "/all-products",
  },
};

export default function ShopDefaultGridPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" />
       */}
      <h1 className="visually-hidden">All Products</h1>
      <Products1 />
      <Footer1 />
    </>
  );
}
