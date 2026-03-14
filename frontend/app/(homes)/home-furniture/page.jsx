import Features from "@/components/common/Features";
import MarqueeSection2 from "@/components/common/MarqueeSection2";
import Products6 from "@/components/common/Products6";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";

import Topbar3 from "@/components/headers/Topbar3";
import Collections from "@/components/homes/Women/Collections";
import Collections2 from "@/components/homes/Women/Collections2";
import Hero from "@/components/homes/Women/Hero";
import Lookbook from "@/components/homes/Women/Lookbook";
import Products from "@/components/homes/Women/Products";
import ShopGram from "@/components/homes/Women/ShopGram";
import Testimonials from "@/components/homes/Women/Testimonials";
import React from "react";

export const metadata = {
  title: "Home Women || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function HomeWomenPage() {
  return (
    <>
      {/* <Topbar3 />
      <Header1 fullWidth /> */}
      <Hero />
      <MarqueeSection2 parentClass="tf-marquee bg-light-blue-4 border-0" />
      <Collections />
      <Products />
      <Lookbook />
      <Products6 />
      <Collections2 />
      <Testimonials />
      <Features parentClass="flat-spacing line-top-container" />
      <ShopGram />
      <Footer1 border={false} />
    </>
  );
}
