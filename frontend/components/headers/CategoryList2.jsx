"use client";
import React from "react";
import { useSelector } from "react-redux";
import Link from "next/link";

export default function CategoryList2() {
  const { categories, loading, error } = useSelector((state) => state.category);

  if (loading) return <div className="list-categories-inner"><p className="p-3">Loading...</p></div>;
  if (error) return <div className="list-categories-inner"><p className="p-3 text-danger">Error loading categories</p></div>;

  return (
    <div className="list-categories-inner">
      <ul className="text-title">
        {categories?.map((category) => (
          <li key={category._id} className={category.children?.length > 0 ? "sub-categories2" : ""}>
            <Link href={`/shop-collection/${category.slug}`} className="categories-item">
              <span className="inner-left">{category.name}</span>
              {category.children?.length > 0 && <i className="icon icon-arrRight" />}
            </Link>
            {category.children?.length > 0 && (
              <ul className="list-categories-inner">
                {category.children.map((child) => (
                  <li key={child._id}>
                    <Link href={`/shop-collection/${category.slug}/${child.slug}`} className="categories-item text-title">
                      <span className="inner-left">{child.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
