"use client";
import ProductCard1 from "@/components/productCards/ProductCard1";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsStart, fetchProductsSuccess, fetchProductsFailure } from "@/redux/productSlice";
import { getAllProducts } from "@/services/product/product.service";

const tabItems = ["New Arrivals", "Best Seller", "Top Trending"];

export default function Products3({ parentClass = "flat-spacing-3" }) {
  const [activeItem, setActiveItem] = useState(tabItems[0]); // Default the first item as active
  const [selectedItems, setSelectedItems] = useState([]);
  
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);

  useEffect(() => {
    const fetchProds = async () => {
      dispatch(fetchProductsStart());
      try {
        const response = await getAllProducts({ page: 1, limit: 10, sort: 'newest' });
        dispatch(fetchProductsSuccess(response.data));
      } catch (error) {
        dispatch(fetchProductsFailure(error?.message || "Failed to fetch products"));
      }
    };
    fetchProds();
  }, [dispatch]);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const container = document.getElementById("newArrivals");
    if (container) container.classList.remove("filtered");

    setTimeout(() => {
      let filtered = [];
      if (activeItem === "New Arrivals") {
        filtered = products;
      } else if (activeItem === "Top Trending") {
        filtered = products.filter((p) => p.tags?.includes("featured"));
      } else if (activeItem === "Best Seller") {
        // Following "same as for best seller" - using featured tag or best-seller if it exists
        filtered = products.filter((p) => p.tags?.includes("best-seller"));
      }

      const mapped = filtered.map((p) => ({
        ...p,
        id: p._id,
        price: p.basePrice,
        imgSrc: p.images?.[0] || "/images/placeholder.jpg",
        imgHover: p.images?.[1] || p.images?.[0] || "/images/placeholder.jpg",
        // isOnSale: p.tags?.includes("on-sale"),
      }));

      setSelectedItems(mapped);
      if (container) container.classList.add("filtered");
    }, 300);
  }, [activeItem, products]);

  return (
    <section className={parentClass}>
      <div className="container">
        <div className="flat-animate-tab">
          <ul className="tab-product justify-content-sm-center" role="tablist">
            {tabItems.map((item) => (
              <li key={item} className="nav-tab-item">
                <a
                  href={`#`} // Generate href dynamically
                  className={activeItem === item ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    setActiveItem(item);
                  }}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <div className="tab-content">
            <div
              className="tab-pane active show tabFilter filtered"
              id="newArrivals"
              role="tabpanel"
            >
              <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
                {loading ? (
                  <div className="text-center w-100">Loading products...</div>
                ) : selectedItems.length > 0 ? (
                  selectedItems.map((product, i) => (
                    <ProductCard1 key={i} product={product} />
                  ))
                ) : (
                  <div className="text-center w-100">No products found.</div>
                )}
              </div>
              <div className="sec-btn text-center">
                <Link href={`/shop-default-grid`} className="btn-line">
                  View All Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
