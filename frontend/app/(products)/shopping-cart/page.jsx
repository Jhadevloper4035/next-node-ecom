import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import ShopCart from "@/components/otherPages/ShopCart";
import React from "react";

export const metadata = {
  title:
    "Shopping Cart || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function ShopingCartPage() {
  return (
    <>
      <ShopCart />
      <Footer1 />
    </>
  );
}
