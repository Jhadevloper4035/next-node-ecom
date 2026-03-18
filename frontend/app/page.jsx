// import Topbar from "@/components/headers/Topbar";
// import BannerCountdown from "@/components/homes/home-1/BannerCountdown";


import Footer from "@/components/footers/Footer1";

import BannerCollection from "@/components/homes/home-1/BannerCollection";
import BannerDiscover from "@/components/homes/home-1/BannerDiscover";
import LookBook from "@/components/homes/decor/LookBook";

import Collections from "@/components/homes/decor/Collections";
import Features from "@/components/common/Features";
import Hero from "@/components/homes/home-1/Hero";

import Products from "@/components/common/Products2";
import ShopGram from "@/components/common/ShopGram";

import Testimonials from "@/components/homes/decor/Testimonials";

export const metadata = {
  title: "Curve & Comfort-Where elegant design meets everyday comfort",
  description: "Discover the perfect blend of style and comfort with thoughtfully designed pieces made for everyday living. Crafted with quality materials and timeless aesthetics, Curve & Comfort brings effortless elegance into your space and lifestyle.",
};

export default function HomePage() {
  return (
    <>
      <Hero />

      

      <Collections />

      <Products title="Best Selling" filter="on-sale" parentClass="flat-spacing-3" />

      <BannerDiscover />

      <Products title="Top Trending" filter="featured" parentClass="flat-spacing-3" />

      <LookBook />

      <Products title="New Arrivals" parentClass="flat-spacing-3" />

      <BannerCollection />

      <Testimonials />

      <ShopGram />
      {/* <Features /> */}
      <Footer />
    </>
  );
}
