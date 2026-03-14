"use client";
import React, { useEffect, useState } from "react";
import Slider1 from "../sliders/Slider1";
import ColorSelect from "../ColorSelect";
import SizeSelect from "../SizeSelect";
import QuantitySelect from "../QuantitySelect";
import Image from "next/image";
import { useAppState } from "@/context/useAppState";
import ProductStikyBottom from "../ProductStikyBottom";
import ProductOptionSelector from "../ProductOptionSelector";
export default function Details1({ product }) {
  const [activeColor, setActiveColor] = useState("gray");
  const [quantity, setQuantity] = useState(1);
  const {
    addProductToCart,
    isAddedToCartProducts,
    addToWishlist,
    isAddedtoWishlist,
    isAddedtoCompareItem,
    addToCompareItem,
    cartProducts,
    updateQuantity,
  } = useAppState();

  // Define options from product.optionPricing if available
  const optionPricing = product?.optionPricing || {};

  const formatOption = (o, i) => {
    let subText = "Included";
    let price = 0;
    
    if (o.priceOverride != null && o.priceOverride > 0) {
      subText = `₹${o.priceOverride.toLocaleString()}`;
      price = o.priceOverride;
    } else if (o.priceDelta != null && o.priceDelta > 0) {
      subText = `+₹${o.priceDelta.toLocaleString()}`;
      price = o.priceDelta;
    }
    
    return {
      id: o._id || i,
      name: o.value || o.label,
      subText,
      price,
      isOverride: o.priceOverride != null && o.priceOverride > 0
    };
  };

  const sizeOptions = (optionPricing.sizes || []).map(formatOption);
  const fabricOptions = (optionPricing.fabrics || []).map(formatOption);
  const materialOptions = (optionPricing.materials || []).map(formatOption);
  const foamOptions = (optionPricing.foams || []).map(formatOption);

  const [selectedSize, setSelectedSize] = useState(""); 
  const [selectedFabric, setSelectedFabric] = useState(""); 
  const [selectedMaterial, setSelectedMaterial] = useState(""); 
  const [selectedFoam, setSelectedFoam] = useState(""); 

  useEffect(() => {
    if (sizeOptions.length > 0 && !selectedSize) {
      setSelectedSize(sizeOptions[0].name);
    }
  }, [product, sizeOptions, selectedSize]);

  // Calculate current price based on selections
  const baseProductPrice = product?.price || product?.basePrice || 0;
  const selectedSizeObj = sizeOptions.find((o) => o.name === selectedSize);
  
  let currentSizePrice = baseProductPrice;
  if (selectedSizeObj) {
    if (selectedSizeObj.isOverride) {
      currentSizePrice = selectedSizeObj.price;
    } else {
      currentSizePrice += selectedSizeObj.price;
    }
  }

  const currentFabricPrice = fabricOptions.find(o => o.name === selectedFabric)?.price || 0;
  const currentMaterialPrice = materialOptions.find(o => o.name === selectedMaterial)?.price || 0;
  const currentFoamPrice = foamOptions.find(o => o.name === selectedFoam)?.price || 0;
  
  const totalPrice = currentSizePrice + currentFabricPrice + currentMaterialPrice + currentFoamPrice;

  return (
    <section className="flat-spacing">
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            {/* Product default */}
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <Slider1
                  setActiveColor={setActiveColor}
                  activeColor={activeColor}
                  firstItem={product.imgSrc}
                  slideItems={product.slideItems}
                />
              </div>
            </div>
            {/* /Product default */}
            {/* tf-product-info-list */}
            <div className="col-md-6">
              <div className="tf-product-info-wrap position-relative mw-100p-hidden ">
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom">
                  <div className="tf-product-info-heading">
                    <div className="tf-product-info-name">
                      <div className="text text-btn-uppercase">{product.category?.name || "Product"}</div>
                      <h3 className="name">{product.title}</h3>
                      <div className="sub">
                        <div className="tf-product-info-rate">
                          <div className="list-star">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`icon icon-star ${i < Math.floor(product.rating || 5) ? "" : "text-secondary"}`} />
                            ))}
                          </div>
                          <div className="text text-caption-1">
                            ({product.reviewsCount || 0} reviews)
                          </div>
                        </div>
                        <div className="tf-product-info-sold">
                          <i className="icon icon-lightning" />
                          <div className="text text-caption-1">
                            In Stock: {product.stock}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="tf-product-info-desc">
                      <div className="tf-product-info-price">
                        <h5 className="price-on-sale font-2">
                          {" "}
                          ₹{totalPrice.toLocaleString()}
                        </h5>
                      </div>
                      <p>
                        {product.description?.substring(0, 150)}...
                      </p>
                      <div className="tf-product-info-liveview">
                        <i className="icon icon-eye" />
                        <p className="text-caption-1">
                          <span className="liveview-count">21</span> people are
                          viewing this right now
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="tf-product-info-choose-option">
                    <ProductOptionSelector
                      label="Size"
                      options={sizeOptions}
                      selectedValue={selectedSize}
                      onSelect={setSelectedSize}
                    />
                    <ProductOptionSelector
                      label="Fabric"
                      options={fabricOptions}
                      selectedValue={selectedFabric}
                      onSelect={setSelectedFabric}
                    />
                    <ProductOptionSelector
                      label="Material"
                      options={materialOptions}
                      selectedValue={selectedMaterial}
                      onSelect={setSelectedMaterial}
                    />
                    <ProductOptionSelector
                      label="Foams"
                      options={foamOptions}
                      selectedValue={selectedFoam}
                      onSelect={setSelectedFoam}
                    />
                    <ColorSelect
                      setActiveColor={setActiveColor}
                      activeColor={activeColor}
                    />
                    <div className="tf-product-info-quantity">
                      <div className="title mb_12">Quantity:</div>
                      <QuantitySelect
                        quantity={
                          isAddedToCartProducts(product.id)
                            ? cartProducts.find((elm) => elm.id == product.id)?.quantity || 1
                            : quantity
                        }
                        setQuantity={(qty) => {
                          if (isAddedToCartProducts(product.id)) {
                            updateQuantity(product.id, qty);
                          } else {
                            setQuantity(qty);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className="tf-product-info-by-btn mb_10">
                        <a
                          onClick={() => {
                            const newProduct = {
                              ...product,
                              price: totalPrice,
                              selectedSize,
                              selectedFabric,
                              selectedMaterial,
                              selectedFoam,
                              selectedColor: activeColor
                            };
                            addProductToCart(product.id, quantity, true, newProduct);
                          }}
                          className="btn-style-2 flex-grow-1 text-btn-uppercase fw-6 btn-add-to-cart"
                        >
                          <span>
                            {isAddedToCartProducts(product.id)
                              ? "Already Added"
                              : "Add to cart -"}
                          </span>
                          <span className="tf-qty-price total-price">
                            {" "}
                            ₹
                              {isAddedToCartProducts(product.id)
                                ? (
                                    totalPrice *
                                    (cartProducts.find((elm) => elm.id == product.id)?.quantity || 1)
                                  ).toLocaleString()
                                : (totalPrice * quantity).toLocaleString()}{" "}
                          </span>
                        </a>
                        <a
                          href="#compare"
                          data-bs-toggle="offcanvas"
                          aria-controls="compare"
                          onClick={() => addToCompareItem(product.id)}
                          className="box-icon hover-tooltip compare btn-icon-action"
                        >
                          <span className="icon icon-gitDiff" />
                          <span className="tooltip text-caption-2">
                            {isAddedtoCompareItem(product.id)
                              ? "Already compared"
                              : "Compare"}
                          </span>
                        </a>
                        <a
                          onClick={() => {
                            const newProduct = {
                              ...product,
                              price: totalPrice,
                              selectedOptions: [
                                { label: "Size", value: selectedSize },
                                { label: "Fabric", value: selectedFabric },
                                { label: "Material", value: selectedMaterial },
                                { label: "Foam", value: selectedFoam },
                                { label: "Color", value: activeColor }
                              ].filter(o => o.value)
                            };
                            addToWishlist(product.id, newProduct);
                          }}
                          className="box-icon hover-tooltip text-caption-2 wishlist btn-icon-action"
                        >
                          <span className="icon icon-heart" />
                          <span className="tooltip text-caption-2">
                            {isAddedtoWishlist(product.id)
                              ? "Already Wishlished"
                              : "Wishlist"}
                          </span>
                        </a>

                      </div>
                      <a href="#" className="btn-style-3 text-btn-uppercase">
                        Buy it now
                      </a>
                    </div>
                    <div className="tf-product-info-help">
                      <div className="tf-product-info-extra-link">
                        <a
                          href="#delivery_return"
                          data-bs-toggle="modal"
                          className="tf-product-extra-icon"
                        >
                          <div className="icon">
                            <i className="icon-shipping" />
                          </div>
                          <p className="text-caption-1">
                            Delivery &amp; Return
                          </p>
                        </a>
                        <a
                          href="#ask_question"
                          data-bs-toggle="modal"
                          className="tf-product-extra-icon"
                        >
                          <div className="icon">
                            <i className="icon-question" />
                          </div>
                          <p className="text-caption-1">Ask A Question</p>
                        </a>
                        <a
                          href="#share_social"
                          data-bs-toggle="modal"
                          className="tf-product-extra-icon"
                        >
                          <div className="icon">
                            <i className="icon-share" />
                          </div>
                          <p className="text-caption-1">Share</p>
                        </a>
                      </div>
                      <div className="tf-product-info-time">
                        <div className="icon">
                          <i className="icon-timer" />
                        </div>
                        <p className="text-caption-1">
                          Estimated Delivery:&nbsp;&nbsp;<span>3-6 days</span>
                        </p>
                      </div>
                      <div className="tf-product-info-return">
                        <div className="icon">
                          <i className="icon-arrowClockwise" />
                        </div>
                        <p className="text-caption-1">
                          Return within <span>45 days</span> of purchase.
                        </p>
                      </div>
                    </div>
                    <ul className="tf-product-info-sku">
                      <li>
                        <p className="text-caption-1">SKU:</p>
                        <p className="text-caption-1 text-1">{(product.id || "").toString().slice(-8).toUpperCase()}</p>
                      </li>
                      <li>
                        <p className="text-caption-1">Vendor:</p>
                        <p className="text-caption-1 text-1">Modave</p>
                      </li>
                      <li>
                        <p className="text-caption-1">Available:</p>
                        <p className="text-caption-1 text-1">{product.stock > 0 ? "In Stock" : "Out of Stock"}</p>
                      </li>
                      <li>
                        <p className="text-caption-1">Categories:</p>
                        <p className="text-caption-1">
                          {product.category && (
                            <a href={`/shop-collection/${product.category.slug}`} className="text-1 link text-capitalize">
                              {product.category.name}
                            </a>
                          )}
                          {product.subcategories?.map((sub, i) => (
                            <React.Fragment key={sub._id || i}>
                              ,{" "}
                              <a href={`/shop-collection/${product.category?.slug}/${sub.slug}`} className="text-1 link text-capitalize">
                                {sub.name}
                              </a>
                            </React.Fragment>
                          ))}
                        </p>
                      </li>
                    </ul>
                    <div className="tf-product-info-guranteed">
                      <div className="text-title">Guranteed safe checkout:</div>
                      <div className="tf-payment">
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-1.png"
                            width={100}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-2.png"
                            width={100}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-3.png"
                            width={100}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-4.png"
                            width={98}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-5.png"
                            width={102}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-6.png"
                            width={98}
                            height={64}
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /tf-product-info-list */}
          </div>
        </div>
      </div>
      <ProductStikyBottom />
    </section>
  );
}
