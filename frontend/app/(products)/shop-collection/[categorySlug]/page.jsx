import Footer1 from "@/components/footers/Footer1";
import CategoryProducts from "@/components/products/CategoryProducts";
import { getCategoryImage } from "@/data/categoryData";
import Link from "next/link";
import React from "react";

const seoDetails = {
  sofas: {
    title: "Buy Sofa Set Online | Premium Luxury Sofas & Couches - Curve & Comfort",
    description: "Shop premium luxury sofa sets online. Discover designer sofas and lounges crafted for maximum durability and contemporary style. Check the best sofa set prices and order online today.",
    keywords: ["buy sofa set", "online sofa set", "order sofa online", "buy sofa online", "price of sofa set", "order couch online"],
    canonical: "https://curve-comfort.com/collections/sofas",
  },
  chairs: {
    title: "Buy Chairs Online | Premium Accent & Living Room Chairs - Curve & Comfort",
    description: "Shop our exclusive collection of luxury chairs online. Find modern designer accent chairs, executive seating, and premium living room chairs built for ergonomic support and elegance.",
    keywords: ["buy chairs online", "chairs online", "buy chair", "order chair online", "online chair purchase", "chair online order"],
    canonical: "https://curve-comfort.com/collections/chairs-and-ottomans",
  },
  "chairs-and-ottomans": {
    title: "Buy Chairs Online | Premium Accent & Living Room Chairs - Curve & Comfort",
    description: "Shop our exclusive collection of luxury chairs online. Find modern designer accent chairs, executive seating, and premium living room chairs built for ergonomic support and elegance.",
    keywords: ["buy chairs online", "chairs online", "buy chair", "order chair online", "online chair purchase", "chair online order"],
    canonical: "https://curve-comfort.com/collections/chairs-and-ottomans",
  },
  "chairs-ottomans": {
    title: "Buy Chairs Online | Premium Accent & Living Room Chairs - Curve & Comfort",
    description: "Shop our exclusive collection of luxury chairs online. Find modern designer accent chairs, executive seating, and premium living room chairs built for ergonomic support and elegance.",
    keywords: ["buy chairs online", "chairs online", "buy chair", "order chair online", "online chair purchase", "chair online order"],
    canonical: "https://curve-comfort.com/collections/chairs-and-ottomans",
  },
  beds: {
    title: "Online Bed Purchase | Luxury & Premium Beds Online - Curve & Comfort",
    description: "Complete your online bed purchase with Curve & Comfort. Explore our exquisite collection of premium luxury beds and designer bedroom furniture sets. Shop the collection today.",
    keywords: ["online bed purchase", "bed online", "buy bed online", "luxury bedroom furniture", "high end beds", "premium wooden beds"],
    canonical: "https://curve-comfort.com/collections/beds",
  },
  "wooden-furniture": {
    title: "Online Wooden Furniture | Premium Solid Wood Designs - Curve & Comfort",
    description: "Discover handcrafted online wooden furniture collections at Curve & Comfort. Premium solid wood tables, cabinets, and custom furniture pieces for modern luxury homes in Delhi NCR.",
    keywords: ["online wooden furniture", "best online furniture shops", "furniture online delhi", "premium furniture online", "best online furniture shopping"],
    canonical: "https://curve-comfort.com/collections/wooden-furniture",
  },
  kitchen: {
    title: "Kitchen Furniture Online | Premium Modular Kitchen Designs - Curve & Comfort",
    description: "Explore premium kitchen furniture and modular kitchen designs from Curve & Comfort. Discover elegant storage, counters, and custom kitchen solutions for modern homes.",
    keywords: ["kitchen furniture online", "modular kitchen furniture", "premium kitchen designs", "custom kitchen furniture"],
    canonical: "https://curve-comfort.com/collections/kitchen",
  },
  wardrobe: {
    title: "Wardrobe Furniture Online | Premium Custom Wardrobes - Curve & Comfort",
    description: "Shop premium wardrobe furniture and custom wardrobe designs from Curve & Comfort. Discover elegant storage solutions for luxury bedrooms and modern homes.",
    keywords: ["wardrobe furniture online", "custom wardrobes", "premium wardrobe designs", "luxury bedroom storage"],
    canonical: "https://curve-comfort.com/collections/wardrobe",
  },
  wardrobes: {
    title: "Wardrobe Furniture Online | Premium Custom Wardrobes - Curve & Comfort",
    description: "Shop premium wardrobe furniture and custom wardrobe designs from Curve & Comfort. Discover elegant storage solutions for luxury bedrooms and modern homes.",
    keywords: ["wardrobe furniture online", "custom wardrobes", "premium wardrobe designs", "luxury bedroom storage"],
    canonical: "https://curve-comfort.com/collections/wardrobe",
  },
};

export async function generateMetadata({ params }) {
  const { categorySlug } = await params;
  const details = seoDetails[categorySlug];

  return details
    ? {
        title: details.title,
      description: details.description,
      keywords: details.keywords,
      alternates: {
        canonical: details.canonical,
      },
      openGraph: {
        title: details.title,
        description: details.description,
        url: details.canonical,
        type: "website",
      },
    }
    : {};
}

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;

  // Format titles for display
  const categoryTitle = categorySlug.replace(/-/g, " ");
  const backgroundImage = getCategoryImage(categorySlug);

  return (
    <>
      <div
        className="page-title"
        style={{ backgroundImage }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center text-capitalize">{categoryTitle}</h1>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li className="text-capitalize">{categoryTitle}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <CategoryProducts 
        categorySlug={categorySlug} 
      />
      
      <Footer1 />
    </>
  );
}
