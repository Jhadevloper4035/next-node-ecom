"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { products } from "@/data/products";
import { Swiper, SwiperSlide } from "swiper/react";
import ProductCard1 from "../productCards/ProductCard1";
import {
  blogLinks,
  demoItems,
  otherPageLinks,
  otherShopMenus,
  productFeatures,
  productLinks,
  productStyles,
  shopFeatures,
  shopLayout,
  swatchLinks,
} from "@/data/menu";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoriesStart, fetchCategoriesSuccess, fetchCategoriesFailure } from "@/redux/categorySlice";
import { getAllCategories } from "@/services/category/category.service";

export default function Nav() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.category);

  useEffect(() => {
    const fetchCats = async () => {
      dispatch(fetchCategoriesStart());
      try {
        const response = await getAllCategories();
        dispatch(fetchCategoriesSuccess(response.data));
      } catch (error) {
        dispatch(fetchCategoriesFailure(error?.message || "Failed to fetch categories"));
      }
    };
    fetchCats();
  }, [dispatch]);

  const isCategoryActive = (category) => {
    if (pathname.includes(`/shop-collection/${category.slug}`)) return true;
    return category.children?.some((child) =>
      pathname.includes(`/shop-collection/${child.slug}`)
    );
  };
  return (
    <>


      {loading ? (
        <li className="menu-item">
          <a href="#" className="item-link">Loading...</a>
        </li>
      ) : error ? (
        <li className="menu-item">
          {/* <a href="#" className="item-link text-danger">Error loading categories</a> */}
          console.log(error);
        </li>
      ) : (
        categories?.map((category) => (
          <li
            key={category._id}
            className={`menu-item ${isCategoryActive(category) ? "active" : ""
              } ${category.children?.length > 0 ? "position-relative" : ""}`}
          >
            <Link
              href={`/shop-collection/${category.slug}`}
              className="item-link"
            >
              {category.name}
              {category.children?.length > 0 && (
                <i className="icon icon-arrow-down" />
              )}
            </Link>
            {category.children?.length > 0 && (
              <div className="sub-menu submenu-default">
                <ul className="menu-list">
                  {category.children.map((child) => (
                    <li
                      key={child._id}
                      className={`menu-item-li ${pathname.includes(child.slug) ? "active" : ""
                        }`}
                    >
                      <Link
                        href={`/shop-collection/${category.slug}/${child.slug}`}
                        className="menu-link-text"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))
      )}



    </>
  );
}
