"use client";

import { useEffect, useState } from "react";

const sectionIds = [
  "refund-window",
  "cancellation-policy",
  "how-to-initiate",
  "cashfree-refunds",
  "return-shipping",
  "partial-refunds",
  "non-refundable",
  "exchange-policy",
  "warranty-claims",
  "dispute-resolution",
  "contact-support",
];

const sections = [
  { id: 1, text: "7-Day Refund Window", scroll: "refund-window" },
  { id: 2, text: "Cancellation Policy", scroll: "cancellation-policy" },
  { id: 3, text: "How to Initiate a Return", scroll: "how-to-initiate" },
  { id: 4, text: "Refunds via Cashfree", scroll: "cashfree-refunds" },
  { id: 5, text: "Return Shipping", scroll: "return-shipping" },
  { id: 6, text: "Partial Refunds", scroll: "partial-refunds" },
  { id: 7, text: "Non-Refundable Items", scroll: "non-refundable" },
  { id: 8, text: "Exchange Policy", scroll: "exchange-policy" },
  { id: 9, text: "Warranty Claims", scroll: "warranty-claims" },
  { id: 10, text: "Dispute Resolution", scroll: "dispute-resolution" },
  { id: 11, text: "Contact Support", scroll: "contact-support" },
];

export default function RefundPolicy() {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px" }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id) => {
    document
      .getElementById(id)
      .scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="terms-of-use-wrap">
          <div className="left sticky-top">
            {sections.map(({ id, text, scroll }) => (
              <h6
                key={id}
                onClick={() => handleClick(scroll)}
                className={`btn-scroll-target ${
                  activeSection === scroll ? "active" : ""
                }`}
              >
                {id}. {text}
              </h6>
            ))}
          </div>

          <div className="right">
            <h4 className="heading">Refund &amp; Return Policy</h4>
            <p className="terms-meta">
              Effective Date: March 2026 &nbsp;|&nbsp; curve-comfort.com
            </p>

            {/* intro */}
            <div className="terms-of-use-item">
              <div className="terms-of-use-content">
                <p>
                  At Curve &amp; Comfort, we are committed to ensuring your complete
                  satisfaction with every purchase. This policy explains the conditions
                  under which refunds, returns, and cancellations are accepted, and the
                  process for initiating them.
                </p>
                <p>
                  This policy is in compliance with the Consumer Protection Act, 2019 and
                  applicable e-commerce regulations in India. All refund transactions are
                  processed through Cashfree Payments, our RBI-authorised payment gateway
                  partner.
                </p>
              </div>
            </div>

            {/* 1 */}
            <div className="terms-of-use-item item-scroll-target" id="refund-window">
              <h5 className="terms-of-use-title">1. 7-Day Refund Window</h5>
              <div className="terms-of-use-content">
                <p>
                  Curve &amp; Comfort offers a <strong>7-day refund policy</strong> from
                  the date of delivery. If you are not satisfied with your purchase for any
                  eligible reason listed below, you may request a refund or return within 7
                  calendar days of receiving your order.
                </p>
                <p>
                  <strong>Eligible reasons:</strong> Product delivered is damaged or
                  defective; product received is significantly different from the
                  description or images on our website; wrong product delivered; or missing
                  parts or components that render the product non-functional.
                </p>
                <p>
                  <strong>Not eligible:</strong> Change of mind after delivery; custom or
                  made-to-order furniture; products that have been assembled, installed, or
                  modified; products showing signs of use or damage caused after delivery;
                  products returned without original packaging; or damage caused by misuse
                  or improper care.
                </p>
              </div>
            </div>

            {/* 2 */}
            <div className="terms-of-use-item item-scroll-target" id="cancellation-policy">
              <h5 className="terms-of-use-title">2. Cancellation Policy</h5>
              <div className="terms-of-use-content">
                <p>
                  Orders can be cancelled free of charge within 24 hours of placement. For
                  cancellations made after 24 hours but before dispatch, a cancellation fee
                  of up to 5% of the order value may be applicable to cover processing
                  charges.
                </p>
                <p>
                  Once an order has been dispatched, cancellations are not accepted. You
                  may initiate a return after delivery in accordance with Section 1 of this
                  policy.
                </p>
                <p>
                  Cancellations for custom or made-to-order furniture are not accepted once
                  production has commenced. In such cases, cancellation within 24 hours of
                  order placement is the only eligible window.
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="terms-of-use-item item-scroll-target" id="how-to-initiate">
              <h5 className="terms-of-use-title">3. How to Initiate a Return or Refund</h5>
              <div className="terms-of-use-content">
                <p>
                  <strong>Step 1 —</strong> Contact us within 7 days of delivery via email
                  at info@curve-comfort.com or call +91 92891 66363.
                </p>
                <p>
                  <strong>Step 2 —</strong> Provide your Order ID, date of delivery,
                  reason for return, and supporting photographs of the product (especially
                  for damage claims).
                </p>
                <p>
                  <strong>Step 3 —</strong> Our customer support team will review your
                  request and respond within 48 business hours. Upon approval, we will
                  arrange a reverse pickup or guide you on return shipping. Once the
                  returned item is received and inspected, your refund will be initiated.
                </p>
              </div>
            </div>

            {/* 4 */}
            <div className="terms-of-use-item item-scroll-target" id="cashfree-refunds">
              <h5 className="terms-of-use-title">4. Refund Processing via Cashfree Payments</h5>
              <div className="terms-of-use-content">
                <p>
                  All refunds are processed through Cashfree Payments, our RBI-authorised
                  payment gateway. The following timelines apply once your return has been
                  approved and the product inspected: Credit/Debit Card — 5–7 business
                  days; Net Banking — 3–5 business days; UPI — 1–3 business days; Wallets
                  (Paytm, PhonePe, etc.) — 1–2 business days; EMI transactions — processed
                  to the card, consult your bank for EMI reversal timelines.
                </p>
                <p>
                  Refund timelines may vary depending on your bank or payment provider.
                  Cashfree Payments' standard refund SLA is up to 7 business days from
                  initiation. If you do not receive your refund within the stated period,
                  please contact us or check your refund status via Cashfree's customer
                  portal.
                </p>
                <p>
                  Once a refund is initiated, you will receive a confirmation email with a
                  Cashfree refund reference ID. Please retain this for your records and
                  share it with your bank if needed to trace the transaction.
                </p>
              </div>
            </div>

            {/* 5 */}
            <div className="terms-of-use-item item-scroll-target" id="return-shipping">
              <h5 className="terms-of-use-title">5. Return Shipping</h5>
              <div className="terms-of-use-content">
                <p>
                  For returns due to damaged, defective, or incorrectly delivered products,
                  Curve &amp; Comfort will arrange and bear the cost of reverse pickup.
                </p>
                <p>
                  For returns initiated due to other eligible reasons, the customer may be
                  required to bear return shipping costs, which will be communicated at the
                  time of return approval.
                </p>
                <p>
                  Products must be packed securely in their original packaging. Curve &amp;
                  Comfort is not liable for damage to products during return transit due to
                  inadequate packaging.
                </p>
              </div>
            </div>

            {/* 6 */}
            <div className="terms-of-use-item item-scroll-target" id="partial-refunds">
              <h5 className="terms-of-use-title">6. Partial Refunds</h5>
              <div className="terms-of-use-content">
                <p>
                  Partial refunds may be issued when only a part of the order is returned
                  or deemed eligible for refund; when a product is returned in a condition
                  that shows signs of use or minor damage not attributable to us; or when
                  original accessories, packaging, or components are missing at the time of
                  return.
                </p>
                <p>
                  The partial refund amount will be communicated to you before processing,
                  and your acceptance will be sought before we proceed.
                </p>
              </div>
            </div>

            {/* 7 */}
            <div className="terms-of-use-item item-scroll-target" id="non-refundable">
              <h5 className="terms-of-use-title">7. Non-Refundable Items &amp; Charges</h5>
              <div className="terms-of-use-content">
                <p>
                  The following are not refundable under any circumstances: delivery and
                  installation charges (unless the return is due to our error); custom
                  upholstery, engraving, or personalisation charges; assembly or
                  white-glove delivery service fees; and products marked as "Final Sale" or
                  "Non-Returnable" on the product page.
                </p>
              </div>
            </div>

            {/* 8 */}
            <div className="terms-of-use-item item-scroll-target" id="exchange-policy">
              <h5 className="terms-of-use-title">8. Exchange Policy</h5>
              <div className="terms-of-use-content">
                <p>
                  If you wish to exchange a product for a different size, colour, or
                  variant, please contact us within 7 days of delivery. Exchanges are
                  subject to product availability and are treated as a return-and-repurchase.
                </p>
                <p>
                  Any price difference will be charged or refunded accordingly via the
                  original payment method through Cashfree Payments.
                </p>
              </div>
            </div>

            {/* 9 */}
            <div className="terms-of-use-item item-scroll-target" id="warranty-claims">
              <h5 className="terms-of-use-title">9. Warranty Claims</h5>
              <div className="terms-of-use-content">
                <p>
                  Warranty-related issues reported after the 7-day refund window will be
                  handled under our product warranty terms. Warranty claims do not qualify
                  for cash refunds but may be eligible for repair, replacement, or store
                  credit at our discretion.
                </p>
                <p>
                  To raise a warranty claim, contact us at info@curve-comfort.com with
                  photographs and your order details. We will respond within 48 business
                  hours.
                </p>
              </div>
            </div>

            {/* 10 */}
            <div className="terms-of-use-item item-scroll-target" id="dispute-resolution">
              <h5 className="terms-of-use-title">10. Dispute Resolution</h5>
              <div className="terms-of-use-content">
                <p>
                  If you are dissatisfied with the outcome of your refund or return
                  request, you may escalate by writing to info@curve-comfort.com with the
                  subject line "Refund Dispute — [Order ID]". We will aim to resolve all
                  disputes within 7 business days.
                </p>
                <p>
                  If the dispute remains unresolved, it may be referred to the Consumer
                  Disputes Redressal Commission under the Consumer Protection Act, 2019, or
                  to binding arbitration in accordance with the Arbitration and Conciliation
                  Act, 1996.
                </p>
              </div>
            </div>

            {/* 11 */}
            <div className="terms-of-use-item item-scroll-target" id="contact-support">
              <h5 className="terms-of-use-title">11. Contact Support</h5>
              <div className="terms-of-use-content">
                <p>
                  For any refund, return, or cancellation queries, please reach out to our
                  customer support team:
                </p>
                <p>
                  <strong>Curve &amp; Comfort — Customer Support</strong>
                  <br />
                  Email: info@curve-comfort.com
                  <br />
                  Phone: +91 92891 66363
                  <br />
                  Website: curve-comfort.com
                  <br />
                  Support Hours: Monday to Saturday, 10:00 AM – 6:00 PM IST
                </p>
                <p>
                  By placing an order on curve-comfort.com, you acknowledge that you have
                  read, understood, and agree to this Refund and Return Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}