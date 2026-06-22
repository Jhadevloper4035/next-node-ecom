"use client";

import Image from "next/image";
import Link from "next/link";

export default function ProductSearchSuggestions({
  id,
  query,
  products,
  isLoading,
  hasError,
  onSelectProduct,
  onViewAll,
}) {
  return (
    <div
      className="mobile-search-suggestions"
      id={id}
      aria-label="Product suggestions"
    >
      {isLoading ? (
        <div className="mobile-search-message" role="status">
          Searching products...
        </div>
      ) : hasError ? (
        <div className="mobile-search-message text-danger" role="status">
          Unable to load suggestions.
        </div>
      ) : products.length ? (
        <>
          <div role="listbox" aria-label="Matching products">
            {products.map((product) => (
              <Link
                key={product.id || product.slug}
                href={
                  product.slug
                    ? `/product/${product.slug}`
                    : `/product-detail/${product.id}`
                }
                className="mobile-search-suggestion"
                role="option"
                aria-selected="false"
                onClick={onSelectProduct}
              >
                <Image
                  src={product.imgSrc}
                  alt=""
                  width={56}
                  height={56}
                  className="mobile-search-suggestion-image"
                />
                <span className="mobile-search-suggestion-info">
                  <span className="mobile-search-suggestion-title">
                    {product.title}
                  </span>
                  <span className="mobile-search-suggestion-category">
                    {product.category?.name || "Furniture"}
                  </span>
                  <span className="mobile-search-suggestion-price">
                    ₹{Number(product.price || 0).toLocaleString("en-IN")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="mobile-search-view-all"
            onClick={onViewAll}
          >
            View all results for &ldquo;{query}&rdquo;
          </button>
        </>
      ) : (
        <div className="mobile-search-message" role="status">
          No matching products found.
        </div>
      )}
    </div>
  );
}
