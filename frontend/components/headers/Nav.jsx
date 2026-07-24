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

const fallbackHeaderCategories = [
  { slug: "beds", name: "Beds", hasChildren: true },
  { slug: "chairs-and-ottomans", name: "Chairs & Ottomans", hasChildren: true },
  { slug: "coffee-tables", name: "Coffee Tables", hasChildren: true },
  { slug: "console-tables", name: "Console Tables", hasChildren: true },
  { slug: "nester-tables", name: "Nester Tables", hasChildren: true },
  { slug: "sofas", name: "Sofas", hasChildren: true },
  { slug: "wall-decor", name: "Wall Decor", hasChildren: true },
  { slug: "kitchen", name: "Kitchen" },
  { slug: "wardrobe", name: "Wardrobe" },
];

export default function Nav() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);

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
    if (pathname.includes(`/collections/${category.slug}`)) return true;
    return category.children?.some((child) =>
      pathname.includes(`/collections/${category.slug}/${child.slug}`)
    );
  };

  const apiCategoriesBySlug = new Map((categories || []).map((category) => [category.slug, category]));
  const fallbackSlugs = new Set(fallbackHeaderCategories.map((category) => category.slug));
  const headerCategories = [
    ...fallbackHeaderCategories.map((category) => ({
      ...category,
      ...apiCategoriesBySlug.get(category.slug),
    })),
    ...(categories || []).filter((category) => !fallbackSlugs.has(category.slug)),
  ];

  return (
    <>
      {headerCategories.map((category) => {
        const hasSubmenu = category.children?.length > 0;

        return (
          <li
            key={category._id || category.slug}
            className={`menu-item ${isCategoryActive(category) ? "active" : ""
              } ${hasSubmenu ? "position-relative" : ""}`}
          >
            <Link
              href={`/collections/${category.slug}`}
              className="item-link"
            >
              {category.name}
              {(hasSubmenu || category.hasChildren) && (
                <i className="icon icon-arrow-down" />
              )}
            </Link>
            {hasSubmenu && (
              <div className="sub-menu submenu-default">
                <ul className="menu-list">
                  {category.children.map((child) => (
                    <li
                      key={child._id}
                      className={`menu-item-li ${pathname.includes(child.slug) ? "active" : ""
                        }`}
                    >
                      <Link
                        href={`/collections/${category.slug}/${child.slug}`}
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
        );
      })}
    </>
  );
}
