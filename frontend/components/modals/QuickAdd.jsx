"use client";
import { useAppState } from "@/context/useAppState";
import { allProducts } from "@/data/products";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ColorSelect from "../productDetails/ColorSelect";
import SizeSelect from "../productDetails/SizeSelect";
import QuantitySelect from "../productDetails/QuantitySelect";
export default function QuickAdd() {
  const [quantity, setQuantity] = useState(1);
  const [activeColor, setActiveColor] = useState("");
  const {
    quickAddItem,
    addProductToCart,
    isAddedToCartProducts,
    addToCompareItem,
    addToWishlist,
    isAddedtoWishlist,
    isAddedtoCompareItem,
    cartProducts,
    updateQuantity,
  } = useAppState();
  const [item, setItem] = useState(allProducts[0]);
  useEffect(() => {
    const filtered = allProducts.filter((el) => el.id == quickAddItem);
    if (filtered) {
      const item = filtered[0];
      setItem(item);

      const colorTags = item.tags
        ?.filter(tag => typeof tag === 'string' && tag.startsWith("color:"))
        .map(tag => tag.split(":")[1].trim());

      if (colorTags?.length > 0) {
        setActiveColor(colorTags[0].toLowerCase().replace(/\s+/g, "-"));
      } else if (item.colors?.length > 0) {
        const firstColor = item.colors[0];
        setActiveColor(
          typeof firstColor === 'string' 
            ? firstColor.toLowerCase().replace(/\s+/g, "-") 
            : (firstColor.color || firstColor.bgColor?.replace("bg-", "") || "")
        );
      } else {
        setActiveColor("");
      }
    }
  }, [quickAddItem]);
  return (
    <div className="modal fade modal-quick-add" id="quickAdd">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="header">
            <span
              className="icon-close icon-close-popup"
              data-bs-dismiss="modal"
            />
          </div>
          <div>
            <div className="tf-product-info-list">
              <div className="tf-product-info-item">
                <div className="image">
                  <Image alt="" src={item.imgSrc} width={600} height={800} />
                </div>
                <div className="content">
                  <Link href={`/product-detail/${item.id}`}>{item.title}</Link>
                  <div className="tf-product-info-price">
                    <h5 className="price-on-sale font-2">
                      ₹{item.price?.toFixed(2) || "0.00"}
                    </h5>
                    {item.oldPrice ? (
                      <>
                        <div className="compare-at-price font-2">
                          ₹{item.oldPrice?.toFixed(2) || "0.00"}
                        </div>
                        <div className="badges-on-sale text-btn-uppercase">
                          -25%
                        </div>
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
              <div className="tf-product-info-choose-option">
                <ColorSelect 
                  activeColor={activeColor} 
                  setActiveColor={setActiveColor} 
                  colorOptions={item.colors?.map((c, i) => {
                    if (typeof c === "string") {
                      return {
                        id: `quick-values-${c.toLowerCase().replace(/\s+/g, "-")}`,
                        value: c,
                        color: c.toLowerCase().replace(/\s+/g, "-"),
                      };
                    }
                    const colorName = c.name || c.value || c.color || c.bgColor?.replace("bg-", "") || "Color";
                    const colorValue = c.color || c.bgColor?.replace("bg-", "") || colorName.toLowerCase().replace(/\s+/g, "-");
                    return {
                      id: `quick-values-${colorValue}-${i}`,
                      value: colorName,
                      color: colorValue,
                    };
                  })}
                />
                <SizeSelect />
                <div className="tf-product-info-quantity">
                  <div className="title mb_12">Quantity:</div>
                  <QuantitySelect
                    quantity={
                      isAddedToCartProducts(item.id)
                        ? cartProducts.filter((elm) => elm.id == item.id)[0]
                            .quantity
                        : quantity
                    }
                    setQuantity={(qty) => {
                      if (isAddedToCartProducts(item.id)) {
                        updateQuantity(item.id, qty);
                      } else {
                        setQuantity(qty);
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="tf-product-info-by-btn mb_10">
                    <a
                      className="btn-style-2 flex-grow-1 text-btn-uppercase fw-6 show-shopping-cart"
                      onClick={() => addProductToCart(item.id, quantity, true, { ...item, selectedColor: activeColor })}
                    >
                      <span>
                        {isAddedToCartProducts(item.id)
                          ? "Already Added"
                          : "Add to cart -"}
                        &nbsp;
                      </span>
                      <span className="tf-qty-price total-price">
                        ₹
                        {isAddedToCartProducts(item.id)
                          ? (
                              (item.price || 0) *
                              (cartProducts.find((elm) => elm.id == item.id)?.quantity || 1)
                            ).toFixed(2)
                          : ((item.price || 0) * (quantity || 1)).toFixed(2)}
                      </span>
                    </a>
                    <a
                      href="#compare"
                      onClick={() => addToCompareItem(item.id)}
                      data-bs-toggle="offcanvas"
                      aria-controls="compare"
                      className="box-icon hover-tooltip compare btn-icon-action show-compare"
                    >
                      <span className="icon icon-gitDiff" />
                      <span className="tooltip text-caption-2">
                        {" "}
                        {isAddedtoCompareItem(item.id)
                          ? "Already compared"
                          : "Compare"}
                      </span>
                    </a>
                    <a
                      onClick={() => addToWishlist(item.id)}
                      className="box-icon hover-tooltip text-caption-2 wishlist btn-icon-action"
                    >
                      <span className="icon icon-heart" />
                      <span className="tooltip text-caption-2">
                        {isAddedtoWishlist(item.id)
                          ? "Already Wishlished"
                          : "Wishlist"}
                      </span>
                    </a>
                  </div>
                  {/* <a href="#" className="btn-style-3 text-btn-uppercase">
                    Buy it now
                  </a> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
