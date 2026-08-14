"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { updateQuantity, removeProduct } from "@/redux/cartSlice";

const formatCartOptions = (product = {}) => {
  if (Array.isArray(product.selectedOptions) && product.selectedOptions.length) {
    return product.selectedOptions
      .map((option) => `${option.label}: ${option.value}`)
      .join(" / ");
  }

  const legacyOptions = [
    product.selectedColor,
    product.selectedFabric,
    product.selectedMaterial,
    product.selectedFoam,
  ].filter(Boolean);

  return legacyOptions.length ? legacyOptions.join(" / ") : "Standard";
};

export default function ShopCart() {
  const dispatch = useDispatch();
  const cartProducts = useSelector((state) => state.cart.cartProducts);
  const totalPrice = useSelector((state) => state.cart.totalPrice);

  const setQuantity = (id, quantity) => {
    if (quantity >= 1) {
      dispatch(updateQuantity({ id, qty: quantity }));
    }
  };

  const removeItem = (id) => {
    dispatch(removeProduct({ id }));
  };
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <section className="flat-spacing">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              {cartProducts.length ? (
                <form onSubmit={(e) => e.preventDefault()}>
                  <table className="tf-table-page-cart">
                    <thead>
                      <tr>
                        <th>Products</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total Price</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {cartProducts.map((elm, i) => (
                        <tr key={i} className="tf-cart-item file-delete">
                          <td className="tf-cart-item_product">
                            <Link
                              href={
                                elm.slug
                                  ? `/product/${elm.slug}`
                                  : `/product-detail/${elm.id}`
                              }
                              className="img-box"
                            >
                              <Image
                                alt="product"
                                src={
                                  elm.imgSrc ||
                                  "/images/placeholder.svg"
                                }
                                width={600}
                                height={800}
                              />
                            </Link>
                            <div className="cart-info">
                              <Link
                                href={
                                  elm.slug
                                    ? `/product/${elm.slug}`
                                    : `/product-detail/${elm.id}`
                                }
                                className="cart-title link"
                              >
                                {elm.title}
                              </Link>
                              <div className="variant-box">
                                <div className="text-secondary-2">
                                  {formatCartOptions(elm)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            data-cart-title="Price"
                            className="tf-cart-item_price text-center"
                          >
                            <div className="cart-price text-button price-on-sale">
                              ₹{elm.price?.toFixed(2) || "0.00"}
                            </div>
                          </td>
                          <td
                            data-cart-title="Quantity"
                            className="tf-cart-item_quantity"
                          >
                            <div className="wg-quantity mx-md-auto">
                              <span
                                className="btn-quantity btn-decrease"
                                onClick={() =>
                                  setQuantity(elm.id, elm.quantity - 1)
                                }
                              >
                                -
                              </span>
                              <input
                                type="text"
                                className="quantity-product"
                                name="number"
                                value={elm.quantity}
                                readOnly
                              />
                              <span
                                className="btn-quantity btn-increase"
                                onClick={() =>
                                  setQuantity(elm.id, elm.quantity + 1)
                                }
                              >
                                +
                              </span>
                            </div>
                          </td>
                          <td
                            data-cart-title="Total"
                            className="tf-cart-item_total text-center"
                          >
                            <div className="cart-total text-button total-price">
                              ₹
                              {((elm.price || 0) * (elm.quantity || 0)).toFixed(
                                2,
                              )}
                            </div>
                          </td>
                          <td
                            data-cart-title="Remove"
                            className="remove-cart"
                            onClick={() => removeItem(elm.id)}
                          >
                            <span className="remove icon icon-close" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* <div className="ip-discount-code">
                    <input type="text" placeholder="Add voucher discount" />
                    <button className="tf-btn">
                      <span className="text">Apply Code</span>
                    </button>
                  </div> */}
                  {/* <div className="group-discount">
                    {discounts.map((item, index) => (
                      <div
                        key={index}
                        className={`box-discount ${
                          activeDiscountIndex === index ? "active" : ""
                        }`}
                        onClick={() => setActiveDiscountIndex(index)}
                      >
                        <div className="discount-top">
                          <div className="discount-off">
                            <div className="text-caption-1">Discount</div>
                            <span className="sale-off text-btn-uppercase">
                              {item.discount}
                            </span>
                          </div>
                          <div className="discount-from">
                            <p className="text-caption-1">{item.details}</p>
                          </div>
                        </div>
                        <div className="discount-bot">
                          <span className="text-btn-uppercase">
                            {item.code}
                          </span>
                          <button className="tf-btn">
                            <span className="text">Apply Code</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div> */}
                </form>
              ) : (
                <div>
                  Your cart is empty. Add products to continue shopping. {" "}
                  <Link className="btn-line" href="/all-products">
                    Explore Products
                  </Link>
                </div>
              )}
            </div>
            <div className="col-xl-4">
              <div className="fl-sidebar-cart">
                <div className="box-order bg-surface">
                  <h5 className="title">Order Summary</h5>
                  <div className="subtotal text-button d-flex justify-content-between align-items-center">
                    <span>Subtotal</span>
                    <span className="total">
                      ₹{totalPrice?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="discount text-button d-flex justify-content-between align-items-center">
                    <span>Delivery</span>
                    <span className="total">Calculated at checkout</span>
                  </div>
                  <h5 className="total-order d-flex justify-content-between align-items-center">
                    <span>Total</span>
                    <span className="total">
                      ₹
                      {totalPrice?.toFixed(2) || "0.00"}
                    </span>
                  </h5>
                  <div className="box-progress-checkout">
                    <fieldset className="check-agree">
                      <input
                        type="checkbox"
                        id="check-agree"
                        className="tf-check-rounded"
                      />
                      <label htmlFor="check-agree">
                        I agree with the
                        <Link href={`/term-of-use`}>terms and conditions</Link>
                      </label>
                    </fieldset>
                    <Link href={`/checkout`} className="tf-btn btn-reset">
                      Process To Checkout
                    </Link>
                    <p className="text-button text-center">
                      Or continue shopping
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
