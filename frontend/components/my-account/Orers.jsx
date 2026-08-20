"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyOrders } from "@/services/checkout/checkout.service";

const money = (paise) => `₹${((paise || 0) / 100).toFixed(2)}`;

export default function Orers() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrders().then((response) => setOrders(response.data.orders || [])).catch(() => setError("Unable to load orders."));
  }, []);

  return (
    <div className="my-account-content">
      <div className="account-orders">
        <div className="wrap-account-order">
          <table>
            <thead>
              <tr>
                <th className="fw-6">Order</th>
                <th className="fw-6">Date</th>
                <th className="fw-6">Status</th>
                <th className="fw-6">Total</th>
                <th className="fw-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => <tr className="tf-order-item" key={order.orderNumber}>
                <td>#{order.orderNumber}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.status.replaceAll("_", " ")}</td>
                <td>{money(order.pricing?.totalPaise)} for {order.items.length} items</td>
                <td><Link href={`/my-account-orders-details?order_id=${encodeURIComponent(order.orderNumber)}`} className="tf-btn btn-fill radius-4"><span className="text">View</span></Link></td>
              </tr>)}
              {!orders.length && <tr><td colSpan="5">{error || "No orders yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
