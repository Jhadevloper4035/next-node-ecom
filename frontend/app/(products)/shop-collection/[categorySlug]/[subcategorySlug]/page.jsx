import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import SubcategoryProducts from "@/components/products/SubcategoryProducts";
import { getCategoryImage } from "@/data/categoryData";
import Link from "next/link";
import React from "react";

const titleize = (value = "") =>
  value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function generateMetadata({ params }) {
  const { categorySlug, subcategorySlug } = await params;
  const categoryTitle = titleize(categorySlug);
  const subcategoryTitle = titleize(subcategorySlug);
  const title = `${subcategoryTitle} ${categoryTitle}`;
  const description = `Shop ${subcategoryTitle.toLowerCase()} in our ${categoryTitle.toLowerCase()} collection at Curve & Comfort.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/collections/${categorySlug}/${subcategorySlug}`,
    },
  };
}

export default async function SubcategoryPage({ params }) {
  const { categorySlug, subcategorySlug } = await params;

  // Format titles for display
  const categoryTitle = titleize(categorySlug);
  const subcategoryTitle = titleize(subcategorySlug);
  const backgroundImage = getCategoryImage(categorySlug);

  return (
    <>
      {/* <Topbar6 bgColor="bg-main" />
       */}
      <div
        className="page-title"
        style={{ backgroundImage }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center text-capitalize">{subcategoryTitle}</h1>
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
                  <Link className="link text-capitalize" href={`/collections/${categorySlug}`}>
                    {categoryTitle}
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li className="text-capitalize">{subcategoryTitle}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <SubcategoryProducts 
        categorySlug={categorySlug} 
        subcategorySlug={subcategorySlug} 
      />
      
      <Footer1 />
    </>
  );
}
