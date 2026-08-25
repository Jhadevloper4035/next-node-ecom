import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Products1 from "@/components/products/Products1";
import Link from "next/link";
import React from "react";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("all-products", {
  title: "All Products | Premium Furniture Online | Curve & Comfort",
  description: "Browse premium furniture from Curve & Comfort, including sofas, beds, tables, chairs, wardrobes, kitchen furniture, and wall decor.",
  canonical: "/all-products",
});

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
