import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import SubcategoryProducts from "@/components/products/SubcategoryProducts";
import { getCategoryImage } from "@/data/categoryData";
import Link from "next/link";
import React from "react";

export default async function SubcategoryPage({ params }) {
  const { categorySlug, subcategorySlug } = await params;

  // Format titles for display
  const categoryTitle = categorySlug.replace(/-/g, " ");
  const subcategoryTitle = subcategorySlug.replace(/-/g, " ");
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
              <h3 className="heading text-center text-capitalize">{subcategoryTitle}</h3>
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
                  <Link className="link text-capitalize" href={`/shop-collection/${categorySlug}`}>
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
