"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearCart } from "@/redux/cartSlice";
import { getOrder } from "@/services/checkout/checkout.service";

function CheckoutConfirmationPage() {
  const orderId = useSearchParams().get("order_id");
  const router = useRouter();
  const dispatch = useDispatch();
  const [state, setState] = useState("Confirming your payment…");

  useEffect(() => {
    if (!orderId) return setState("Order reference is missing.");
    let attempts = 0;
    const check = async () => {
      try {
        const order = (await getOrder(orderId)).data.order;
        if (order.status === "confirmed") {
          dispatch(clearCart());
          return router.replace(`/my-account-orders-details?order_id=${encodeURIComponent(order.orderNumber)}`);
        }
        if (["payment_failed", "cancelled"].includes(order.status)) return setState(`Order ${order.orderNumber} was not completed.`);
      } catch { return setState("We could not find that order."); }
      if (++attempts < 5) setTimeout(check, 2_000);
      else setState("Payment is still being confirmed. We will email you when it is complete.");
    };
    check();
  }, [dispatch, orderId, router]);

  const detailsHref = orderId ? `/my-account-orders-details?order_id=${encodeURIComponent(orderId)}` : "/my-account-orders";
  return <section className="flat-spacing"><div className="container text-center"><h2>{state}</h2><Link className="tf-btn btn-reset mt-3" href={detailsHref}><span className="text">View order details</span></Link><Link className="d-block mt-3" href="/my-account-orders">My orders</Link></div></section>;
}

export default function CheckoutConfirmation() {
  return <Suspense fallback={<section className="flat-spacing"><div className="container text-center">Loading order…</div></section>}><CheckoutConfirmationPage /></Suspense>;
}
