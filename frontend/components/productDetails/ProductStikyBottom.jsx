"use client";
import Image from "next/image";
import React, { useState } from "react";
import QuantitySelect from "./QuantitySelect";
import { useAppState } from "@/context/useAppState";

export default function ProductStikyBottom({ product }) {
  const [quantity, setQuantity] = useState(1); // Initial quantity is 1
  const {
    addProductToCart,
    isAddedToCartProducts,
    cartProducts,
    updateQuantity,
  } = useAppState();

  if (!product) return null;

  const cartItem = cartProducts.find((elm) => elm.id == product.id);
  const activeQuantity = cartItem?.quantity || quantity;
  const price = Number(product.price || product.basePrice || 0);

  return (
    <div className="tf-sticky-btn-atc">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <form
              className="form-sticky-atc"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="tf-sticky-atc-product">
                <div className="image">
                  <Image
                    className="lazyload"
                    alt={product.title || "Product"}
                    src={product.imgSrc || "/images/placeholder.svg"}
                    width={600}
                    height={800}
                  />
                </div>
                <div className="content">
                  <div className="text-title">{product.title}</div>
                  <div className="text-caption-1 text-secondary-2">
                    {product.category?.name || "Product"}
                  </div>
                  <div className="text-title">
                    ₹{price.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="tf-sticky-atc-infos">
                <div className="tf-sticky-atc-quantity d-flex gap-12 align-items-center">
                  <div className="tf-sticky-atc-infos-title text-title">
                    Quantity:
                  </div>
                  <QuantitySelect
                    styleClass="style-1"
                    quantity={activeQuantity}
                    setQuantity={(qty) => {
                      if (isAddedToCartProducts(product.id)) {
                        updateQuantity(product.id, qty);
                      } else {
                        setQuantity(qty);
                      }
                    }}
                  />
                </div>
                <div className="tf-sticky-atc-btns">
                  <a
                    onClick={() =>
                      addProductToCart(product.id, quantity, true, product)
                    }
                    className="tf-btn w-100 btn-reset radius-4 btn-add-to-cart"
                  >
                    <span className="text text-btn-uppercase">
                      {" "}
                      {isAddedToCartProducts(product.id)
                        ? "Already Added"
                        : "Add to cart -"}
                    </span>
                    <span className="tf-qty-price total-price">
                      ₹{(price * activeQuantity).toLocaleString()}
                    </span>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
