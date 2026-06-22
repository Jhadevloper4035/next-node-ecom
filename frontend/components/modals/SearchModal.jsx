"use client";
import React, { useEffect, useState } from "react";

import ProductCard1 from "../productCards/ProductCard1";
import { getAllProducts } from "@/services/product/product.service";
import { loadRecentlyViewedProducts, mapProductsForCards } from "@/utlis/productMapper";

export default function SearchModal() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [loadedItems, setLoadedItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    const loadRecent = () => setRecentProducts(loadRecentlyViewedProducts());

    loadRecent();
    window.addEventListener("recentlyVisitedUpdated", loadRecent);
    window.addEventListener("storage", loadRecent);

    return () => {
      window.removeEventListener("recentlyVisitedUpdated", loadRecent);
      window.removeEventListener("storage", loadRecent);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getAllProducts(
          {
            page: 1,
            limit: 24,
            ...(query.trim() ? { q: query.trim() } : {}),
          },
          { silent: true, signal: controller.signal },
        );
        setLoadedItems(mapProductsForCards(response?.data || []));
        setVisibleCount(8);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to search products:", error);
          setLoadedItems([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const timeout = setTimeout(fetchProducts, query.trim() ? 250 : 0);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const displayItems = query.trim()
    ? loadedItems.slice(0, visibleCount)
    : recentProducts.slice(0, visibleCount);
  const totalItems = query.trim() ? loadedItems.length : recentProducts.length;

  const handleLoad = () => {
    setVisibleCount((count) => count + 4);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextQuery = query.trim();
    if (!nextQuery) return;

    const modalElement = document.getElementById("search");
    const modal = window.bootstrap?.Modal?.getInstance(modalElement);
    modal?.hide();

    window.location.href = `/search-result?q=${encodeURIComponent(nextQuery)}`;
  };

  return (
    <div className="modal fade modal-search" id="search">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="d-flex justify-content-between align-items-center">
            <h5>Search</h5>
            <span
              className="icon-close icon-close-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <form className="form-search" onSubmit={handleSubmit}>
            <fieldset className="text">
              <input
                type="text"
                placeholder="Search products..."
                className=""
                name="text"
                tabIndex={0}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-required="true"
              />
            </fieldset>
            <button className="" type="submit">
              <svg
                className="icon"
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="#181818"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21.35 21.0004L17 16.6504"
                  stroke="#181818"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          {/* <div>
            <h5 className="mb_16">Feature keywords Today</h5>
            <ul className="list-tags">
              <li>
                <a href="#" className="radius-60 link">
                  Dresses
                </a>
              </li>
              <li>
                <a href="#" className="radius-60 link">
                  Dresses Women
                </a>
              </li>
              <li>
                <a href="#" className="radius-60 link">
                  Dresses midi
                </a>
              </li>
              <li>
                <a href="#" className="radius-60 link">
                  Dress summer
                </a>
              </li>
            </ul>
          </div> */}
          <div>
            <h6 className="mb_16">
              {query.trim() ? "Search Results" : "Recently viewed products"}
            </h6>
            {loading && query.trim() && (
              <div
                className="d-flex justify-content-center align-items-center py-3"
                role="status"
                aria-label="Searching products"
              >
                <div className="tf-loading loading" />
              </div>
            )}
            <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
              {displayItems.map((product, i) => (
                <ProductCard1 product={product} key={i} />
              ))}
              {!loading && displayItems.length === 0 && (
                <div className="text-secondary-2">
                  {query.trim() ? "No products found." : "No recently viewed products yet."}
                </div>
              )}
            </div>
          </div>
          {/* Load Item */}

          {visibleCount >= totalItems ? (
            ""
          ) : (
            <div
              className="wd-load view-more-button text-center"
              onClick={() => handleLoad()}
            >
              <button
                className={`tf-loading btn-loadmore tf-btn btn-reset ${
                  loading ? "loading" : ""
                } `}
              >
                <span className="text text-btn text-btn-uppercase">
                  Load more
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
