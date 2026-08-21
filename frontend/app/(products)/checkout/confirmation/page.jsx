"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { removePurchasedProducts } from "@/redux/cartSlice";
import { getOrder } from "@/services/checkout/checkout.service";

function CheckoutConfirmationPage() {
  const orderId = useSearchParams().get("order_id");
  const router = useRouter();
  const dispatch = useDispatch();
  const [state, setState] = useState("Confirming your payment…");
  const detailsHref = orderId ? `/my-account-orders-details?order_id=${encodeURIComponent(orderId)}` : "/my-account-orders";

  useEffect(() => {
    if (!orderId) return setState("Order reference is missing.");
    const check = async () => {
      try {
        const order = (await getOrder(orderId)).data.order;
        if (order.status === "confirmed") {
          dispatch(removePurchasedProducts(order.items || []));
          return router.replace(`/my-account-orders-details?order_id=${encodeURIComponent(order.orderNumber)}`);
        }
        if (["failed", "user_dropped", "cancelled"].includes(order.activePaymentTransaction?.status)) {
          return router.replace(`/my-account-orders-details?order_id=${encodeURIComponent(order.orderNumber)}&payment=failed`);
        }
        if (order.status === "pending_payment") return router.replace(`/my-account-orders-details?order_id=${encodeURIComponent(order.orderNumber)}&payment=pending`);
        return setState(`Order ${order.orderNumber} was not completed.`);
      } catch {
        router.replace(`${detailsHref}${detailsHref.includes("?") ? "&" : "?"}payment=pending`);
      }
    };
    check();
  }, [detailsHref, dispatch, orderId, router]);
  return <section className="flat-spacing"><div className="container text-center"><h2>{state}</h2><Link className="tf-btn btn-reset mt-3" href={detailsHref}><span className="text">View order details</span></Link><Link className="d-block mt-3" href="/my-account-orders">My orders</Link></div></section>;
}

export default function CheckoutConfirmation() {
  return <Suspense fallback={<section className="flat-spacing"><div className="container text-center">Loading order…</div></section>}><CheckoutConfirmationPage /></Suspense>;
}
