"use client";

import { useEffect, useState } from "react";

const sectionIds = [
  "general-terms",
  "products-pricing",
  "orders-payment",
  "shipping-delivery",
  "returns-cancellations",
  "warranty",
  "intellectual-property",
  "limitation-liability",
  "governing-law",
  "revisions",
];

const sections = [
  { id: 1, text: "General Terms of Use", scroll: "general-terms" },
  { id: 2, text: "Products & Pricing", scroll: "products-pricing" },
  { id: 3, text: "Orders & Payment", scroll: "orders-payment" },
  { id: 4, text: "Shipping & Delivery", scroll: "shipping-delivery" },
  { id: 5, text: "Returns & Cancellations", scroll: "returns-cancellations" },
  { id: 6, text: "Warranty", scroll: "warranty" },
  { id: 7, text: "Intellectual Property", scroll: "intellectual-property" },
  { id: 8, text: "Limitation of Liability", scroll: "limitation-liability" },
  { id: 9, text: "Governing Law", scroll: "governing-law" },
  { id: 10, text: "Revisions & Errata", scroll: "revisions" },
];

export default function TermsAndConditions() {
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
            <h4 className="heading">Terms &amp; Conditions</h4>
            <p className="terms-meta">
              Effective Date: March 2026 &nbsp;|&nbsp; curve-comfort.com
            </p>

            {/* 1 */}
            <div className="terms-of-use-item item-scroll-target" id="general-terms">
              <h5 className="terms-of-use-title">1. General Terms of Use</h5>
              <div className="terms-of-use-content">
                <p>
                  Welcome to Curve &amp; Comfort. By accessing or using our website at
                  curve-comfort.com, placing orders, or engaging with any of our services,
                  you agree to be bound by these Terms and Conditions. Please read them
                  carefully before making a purchase.
                </p>
                <p>
                  By using curve-comfort.com, you confirm that you are at least 18 years
                  of age, or that you are accessing the site under the supervision of a
                  parent or legal guardian. Your use of our website constitutes acceptance
                  of these terms.
                </p>
                <p>
                  We reserve the right to update or modify these Terms and Conditions at
                  any time without prior notice. Changes will be effective immediately upon
                  posting to the website. It is your responsibility to review these terms
                  periodically.
                </p>
              </div>
            </div>

            {/* 2 */}
            <div className="terms-of-use-item item-scroll-target" id="products-pricing">
              <h5 className="terms-of-use-title">2. Products &amp; Pricing</h5>
              <div className="terms-of-use-content">
                <p>
                  All product descriptions, images, and specifications on our website are
                  provided in good faith and are as accurate as possible. We do not warrant
                  that product descriptions or other content are error-free, complete, or
                  current.
                </p>
                <p>
                  All prices displayed on curve-comfort.com are in Indian Rupees (INR) and
                  include applicable taxes unless stated otherwise. We reserve the right to
                  modify pricing at any time without notice. The price at the time of your
                  order confirmation shall be the binding price.
                </p>
                <p>
                  Due to differences in monitor calibrations and screen settings, actual
                  product colours may vary slightly from what is displayed on screen. Minor
                  variations in natural wood grain, fabric texture, or finish are inherent
                  characteristics of handcrafted and natural materials and are not
                  considered defects.
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="terms-of-use-item item-scroll-target" id="orders-payment">
              <h5 className="terms-of-use-title">3. Orders &amp; Payment</h5>
              <div className="terms-of-use-content">
                <p>
                  By placing an order on our website, you are making an offer to purchase
                  the selected product(s) subject to these Terms. An order confirmation
                  email does not constitute our acceptance of your order. We reserve the
                  right to cancel or refuse any order for reasons including product
                  unavailability, pricing errors, or suspected fraudulent activity.
                </p>
                <p>
                  We accept Credit/Debit Cards (Visa, MasterCard, RuPay), Net Banking,
                  UPI, EMI options through select banks and NBFCs, and Wallets such as
                  Paytm and PhonePe. All payments are processed securely through Cashfree
                  Payments, our RBI-authorised payment gateway partner. Curve &amp; Comfort
                  does not store your payment card details.
                </p>
                <p>
                  Once your payment is successfully processed, you will receive an order
                  confirmation email at the address provided. If you do not receive a
                  confirmation within 24 hours, contact us at info@curve-comfort.com.
                </p>
              </div>
            </div>

            {/* 4 */}
            <div className="terms-of-use-item item-scroll-target" id="shipping-delivery">
              <h5 className="terms-of-use-title">4. Shipping &amp; Delivery</h5>
              <div className="terms-of-use-content">
                <p>
                  Curve &amp; Comfort delivers across India. Standard delivery takes 7–14
                  business days from order confirmation. Custom or made-to-order furniture
                  takes 4–8 weeks from order confirmation. Metro cities may receive faster
                  delivery depending on stock location.
                </p>
                <p>
                  Delivery charges, if applicable, will be displayed at checkout before you
                  confirm your order. Free delivery may be offered on orders above a
                  specified threshold, which may change from time to time.
                </p>
                <p>
                  Please ensure that someone is present at the delivery address to receive
                  the order. Curve &amp; Comfort is not responsible for failed deliveries
                  resulting from an incorrect address or the absence of a recipient.
                  Re-delivery charges may apply in such cases.
                </p>
              </div>
            </div>

            {/* 5 */}
            <div className="terms-of-use-item item-scroll-target" id="returns-cancellations">
              <h5 className="terms-of-use-title">5. Returns &amp; Cancellations</h5>
              <div className="terms-of-use-content">
                <p>
                  Orders may be cancelled within 24 hours of placement for a full refund.
                  After 24 hours, cancellations may not be accepted for custom or
                  made-to-order items. Standard catalogue items may be cancelled before
                  dispatch, subject to a processing fee.
                </p>
                <p>
                  We accept returns within 7 days of delivery if the product is damaged or
                  defective upon delivery, significantly different from what was ordered,
                  unused, in its original packaging, and in a resaleable condition. Returns
                  are not accepted for custom or made-to-order furniture, assembled items,
                  or products showing signs of use or third-party damage.
                </p>
                <p>
                  Approved refunds will be processed within 7–10 business days to the
                  original payment method via Cashfree Payments. Shipping charges are
                  non-refundable unless the return is due to our error or a defective
                  product. To initiate a return, contact us at info@curve-comfort.com or
                  call +91 92891 66363.
                </p>
              </div>
            </div>

            {/* 6 */}
            <div className="terms-of-use-item item-scroll-target" id="warranty">
              <h5 className="terms-of-use-title">6. Warranty</h5>
              <div className="terms-of-use-content">
                <p>
                  All Curve &amp; Comfort products come with a limited manufacturer's
                  warranty against defects in material and workmanship under normal use.
                  Structural frames carry a 1-year warranty, upholstery and fabric a
                  6-month warranty against manufacturing defects, and mechanisms such as
                  recliners and sofa beds a 1-year warranty.
                </p>
                <p>
                  The warranty does not cover normal wear and tear, damage caused by
                  improper use, accidents, or negligence, damage from exposure to direct
                  sunlight, moisture, or chemicals, or unauthorised modifications or
                  repairs.
                </p>
                <p>
                  To make a warranty claim, please contact us at info@curve-comfort.com
                  with photographs and your order details. We will respond within 48
                  business hours.
                </p>
              </div>
            </div>

            {/* 7 */}
            <div className="terms-of-use-item item-scroll-target" id="intellectual-property">
              <h5 className="terms-of-use-title">7. Intellectual Property</h5>
              <div className="terms-of-use-content">
                <p>
                  All content on curve-comfort.com — including but not limited to text,
                  graphics, logos, product images, icons, and software — is the property
                  of Curve &amp; Comfort and is protected by applicable intellectual
                  property laws in India and internationally.
                </p>
                <p>
                  You may not reproduce, distribute, modify, display, or otherwise exploit
                  any content from our website without our express written permission.
                  Unauthorised use of our intellectual property may give rise to a claim
                  for damages and may constitute a criminal offence.
                </p>
              </div>
            </div>

            {/* 8 */}
            <div className="terms-of-use-item item-scroll-target" id="limitation-liability">
              <h5 className="terms-of-use-title">8. Limitation of Liability</h5>
              <div className="terms-of-use-content">
                <p>
                  To the maximum extent permitted by law, Curve &amp; Comfort shall not be
                  liable for any indirect, incidental, special, or consequential damages
                  arising from your use of our products or website, including but not
                  limited to loss of data, loss of profits, or interruption of business.
                </p>
                <p>
                  Our total liability to you for any claim arising out of or in connection
                  with a purchase shall not exceed the total amount paid by you for the
                  product giving rise to the claim. Nothing in these Terms limits our
                  liability for death or personal injury caused by our negligence, or for
                  fraud or fraudulent misrepresentation.
                </p>
              </div>
            </div>

            {/* 9 */}
            <div className="terms-of-use-item item-scroll-target" id="governing-law">
              <h5 className="terms-of-use-title">9. Governing Law</h5>
              <div className="terms-of-use-content">
                <p>
                  These Terms and Conditions shall be governed by and construed in
                  accordance with the laws of India. Any disputes arising in connection
                  with these terms or your use of curve-comfort.com shall be subject to the
                  exclusive jurisdiction of the courts located in India.
                </p>
                <p>
                  We encourage you to contact us directly in the event of any dispute or
                  grievance. If a resolution cannot be reached informally, disputes may be
                  submitted to arbitration in accordance with the Arbitration and
                  Conciliation Act, 1996.
                </p>
              </div>
            </div>

            {/* 10 */}
            <div className="terms-of-use-item item-scroll-target" id="revisions">
              <h5 className="terms-of-use-title">10. Revisions &amp; Errata</h5>
              <div className="terms-of-use-content">
                <p>
                  The materials appearing on curve-comfort.com may include technical,
                  typographical, or photographic errors. Curve &amp; Comfort does not
                  warrant that any of the materials on its website are accurate, complete,
                  or current.
                </p>
                <p>
                  We reserve the right to revise these Terms and Conditions at any time by
                  updating this page. By continuing to use our website after changes are
                  posted, you accept the revised terms.
                </p>
                <p>
                  For any questions about these Terms, please contact us at
                  info@curve-comfort.com or call +91 92891 66363. Our support team is
                  available Monday to Saturday, 10:00 AM – 6:00 PM IST.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}