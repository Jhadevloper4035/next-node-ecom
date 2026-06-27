"use client";
import React from "react";
import Link from "next/link";

export default function Breadcumb({ product }) {
  return (
    <div className="tf-breadcrumb">
      <div className="container">
        <div className="tf-breadcrumb-wrap">
          <div className="tf-breadcrumb-list">
            <Link href={`/`} className="text text-caption-1">
              Home
            </Link>

            {product?.category && (
              <>
                <i className="icon icon-arrRight" />
                <Link 
                  href={`/shop-collection/${product.category.slug}`} 
                  className="text text-caption-1 text-capitalize"
                >
                  {product.category.name}
                </Link>
              </>
            )}

            <i className="icon icon-arrRight" />
            <span className="text text-caption-1">{product?.title}</span>
          </div>
          <div className="tf-breadcrumb-prev-next">
          </div>
        </div>
      </div>
    </div>
  );
}
