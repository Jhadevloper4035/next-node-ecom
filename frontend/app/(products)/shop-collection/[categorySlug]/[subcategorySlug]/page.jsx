import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import SubcategoryProducts from "@/components/products/SubcategoryProducts";
import Link from "next/link";
import React from "react";

export default function SubcategoryPage({ params }) {
  const { categorySlug, subcategorySlug } = params;

  // Format titles for display
  const categoryTitle = categorySlug.replace(/-/g, " ");
  const subcategoryTitle = subcategorySlug.replace(/-/g, " ");

  return (
    <>
      {/* <Topbar6 bgColor="bg-main" />
      <Header1 /> */}
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h3 className="heading text-center text-capitalize">{subcategoryTitle}</h3>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    Homepage
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
