import Footer from "@/components/footers/Footer1";
import BannerCollection from "@/components/homes/home-1/BannerCollection";
import BannerDiscover from "@/components/homes/home-1/BannerDiscover";
import LookBook from "@/components/homes/decor/LookBook";
import Collections from "@/components/homes/decor/Collections";
import Hero from "@/components/homes/home-1/Hero";
import Products from "@/components/common/Products2";
import ShopGram from "@/components/common/ShopGram";
import Testimonials from "@/components/homes/decor/Testimonials";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("home", {
  title: "Online Furniture Stores | Premium Furniture Online - Curve & Comfort",
  description: "Discover premium furniture online at Curve & Comfort. Shop high-end designer sofas, luxury chairs, and premium wooden furniture crafted for ultimate elegance. Buy furniture online today.",
  canonical: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Collections />
      <Products
        title="Best Selling"
        filter="on-sale"
        parentClass="flat-spacing-3"
      />
      <BannerDiscover />
      <Products
        title="Top Trending"
        filter="featured"
        parentClass="flat-spacing-3"
      />
      <LookBook />
      <Products title="New Arrivals" parentClass="flat-spacing-3" />
      <BannerCollection />
      <Testimonials />
      <ShopGram />
      <Footer />
    </>
  );
}
