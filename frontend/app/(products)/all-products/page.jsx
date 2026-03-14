import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Products1 from "@/components/products/Products1";
import Link from "next/link";
import React from "react";

export default function ShopDefaultGridPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" />
      <Header1 /> */}
      <Products1 />
      <Footer1 />
    </>
  );
}
