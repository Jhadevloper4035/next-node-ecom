"use client";
import { useAppState } from "@/context/useAppState";
import { mapProductForCard } from "@/utlis/productMapper";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function ProductCompare() {
  const {
    compareItem,

    addProductToCart,
    isAddedToCartProducts,
  } = useAppState();
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(
      compareItem
        .filter((item) => typeof item === "object" && item !== null)
        .map(mapProductForCard)
    );
  }, [compareItem]);
  return (
    <section className="flat-spacing">
      <div className="container">
        {!items.length ? (
          <div>
            No items to compare yet. Add products to your comparison list and
            decide smarter!{" "}
            <Link className="btn-line" href="/all-products">
              Explore Products
            </Link>
          </div>
        ) : (
          ""
        )}
        {items.length ? (
          <div className="tf-compare-table">
            <div className="tf-compare-row tf-compare-grid">
              <div className="tf-compare-col d-md-block d-none" />
              {items.map((elm, i) => (
                <div key={i} className="tf-compare-col">
                  <div className="tf-compare-item">
                    <Link
                      className="tf-compare-image"
                      href={elm.slug ? `/product/${elm.slug}` : `/product-detail/${elm.id}`}
                    >
                      <Image
                        className="lazyload"
                        alt="img-compare"
                        src={elm.imgSrc || "/images/placeholder.svg"}
                        width={600}
                        height={800}
                      />
                    </Link>
                    <div className="tf-compare-content">
                      <Link
                        className="link text-title text-line-clamp-1"
                        href={elm.slug ? `/product/${elm.slug}` : `/product-detail/${elm.id}`}
                      >
                        {elm.title}
                      </Link>
                      <p className="desc text-caption-1">
                        {elm.category?.name || elm.categoryName || elm.category || "Furniture"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Rating</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field tf-compare-rate"
                >
                  <span>{elm.rating ? `${elm.rating} / 5` : "Not rated"}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Price</h6>
              </div>

              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field text-center"
                >
                  <span className="price">₹{Number(elm.price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Type</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field text-center"
                >
                  <span className="type">{elm.productType || elm.category?.name || elm.categoryName || "—"}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Brand</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field text-center"
                >
                  <span className="brand">{elm.brand || "—"}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Size</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field text-center"
                >
                  <span className="size">{elm.filterSizes?.join(", ") || "—"}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Color</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field text-center"
                >
                  <span>{elm.filterColor?.join(", ") || "—"}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Material</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field text-center"
                >
                  <span className="size">{elm.material || elm.selectedMaterial || "—"}</span>
                </div>
              ))}
            </div>
            <div className="tf-compare-row">
              <div className="tf-compare-col tf-compare-field d-md-block d-none">
                <h6>Add To Cart</h6>
              </div>
              {items.map((elm, i) => (
                <div
                  key={i}
                  className="tf-compare-col tf-compare-field tf-compare-viewcart text-center"
                >
                  <button
                    type="button"
                    className="btn-view-cart"
                    onClick={() => addProductToCart(elm.id, 1, true, elm)}
                  >
                    {isAddedToCartProducts(elm.id)
                      ? "Already Added"
                      : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </section>
  );
}
