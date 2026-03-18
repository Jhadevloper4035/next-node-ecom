"use client";

import { useEffect, useState } from "react";

const sectionIds = [
  "info-we-collect",
  "how-we-use",
  "cashfree-payments",
  "cookies",
  "data-sharing",
  "data-retention",
  "your-rights",
  "data-security",
  "third-party-links",
  "grievance-officer",
  "policy-changes",
];

const sections = [
  { id: 1, text: "Information We Collect", scroll: "info-we-collect" },
  { id: 2, text: "How We Use Your Info", scroll: "how-we-use" },
  { id: 3, text: "Cashfree Payments", scroll: "cashfree-payments" },
  { id: 4, text: "Cookies & Tracking", scroll: "cookies" },
  { id: 5, text: "Data Sharing", scroll: "data-sharing" },
  { id: 6, text: "Data Retention", scroll: "data-retention" },
  { id: 7, text: "Your Rights", scroll: "your-rights" },
  { id: 8, text: "Data Security", scroll: "data-security" },
  { id: 9, text: "Third-Party Links", scroll: "third-party-links" },
  { id: 10, text: "Grievance Officer", scroll: "grievance-officer" },
  { id: 11, text: "Policy Changes", scroll: "policy-changes" },
];

export default function PrivacyPolicy() {
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
            <h4 className="heading">Privacy Policy</h4>
            <p className="terms-meta">
              Effective Date: March 2026 &nbsp;|&nbsp; curve-comfort.com
            </p>

            {/* intro */}
            <div className="terms-of-use-item">
              <div className="terms-of-use-content">
                <p>
                  This Privacy Policy describes how Curve &amp; Comfort collects, uses,
                  stores, and protects your personal information when you visit or make a
                  purchase from curve-comfort.com. By using our website, you consent to the
                  practices described in this policy.
                </p>
                <p>
                  This policy is compliant with the Information Technology Act, 2000, the
                  IT (Reasonable Security Practices) Rules, 2011, and the Digital Personal
                  Data Protection Act, 2023 (DPDPA).
                </p>
              </div>
            </div>

            {/* 1 */}
            <div className="terms-of-use-item item-scroll-target" id="info-we-collect">
              <h5 className="terms-of-use-title">1. Information We Collect</h5>
              <div className="terms-of-use-content">
                <p>
                  <strong>Information you provide directly</strong> — when you register an
                  account or place an order we collect your name, email address, phone
                  number, and billing and shipping address. When you contact our customer
                  support we collect your communication history and complaint details. When
                  you subscribe to our newsletter we collect your email address and
                  preferences.
                </p>
                <p>
                  <strong>Information collected automatically</strong> — when you visit our
                  website we may collect device information (IP address, browser type,
                  operating system), usage data (pages viewed, time spent, referral URLs),
                  and cookie and tracking data (session identifiers, preference cookies,
                  analytics data).
                </p>
                <p>
                  <strong>Payment information</strong> — all payment transactions are
                  processed securely through Cashfree Payments. We do not collect, store,
                  or process your card numbers, CVV, net banking credentials, UPI PINs, or
                  wallet passwords on our servers.
                </p>
              </div>
            </div>

            {/* 2 */}
            <div className="terms-of-use-item item-scroll-target" id="how-we-use">
              <h5 className="terms-of-use-title">2. How We Use Your Information</h5>
              <div className="terms-of-use-content">
                <p>
                  We use the information collected to process, fulfil, and communicate the
                  status of your orders; to verify your identity and prevent fraudulent
                  transactions; to provide customer service and respond to your queries; and
                  to send order confirmations, invoices, and delivery updates.
                </p>
                <p>
                  With your consent, we may also use your information to send promotional
                  communications and newsletters, personalise your shopping experience and
                  product recommendations, and improve our website, services, and product
                  offerings.
                </p>
                <p>
                  We also use your data to comply with legal obligations, resolve disputes,
                  and detect, prevent, and address technical issues or security threats.
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="terms-of-use-item item-scroll-target" id="cashfree-payments">
              <h5 className="terms-of-use-title">3. Cashfree Payments</h5>
              <div className="terms-of-use-content">
                <p>
                  Curve &amp; Comfort uses Cashfree Payments as its payment gateway for
                  processing all online transactions. Cashfree Payments is authorised by
                  the Reserve Bank of India (RBI) as a Payment Aggregator and is PCI DSS
                  Level 1 certified — the highest level of payment security compliance.
                </p>
                <p>
                  All payment data is encrypted using industry-standard SSL/TLS protocols.
                  We do not store any card details, OTPs, UPI credentials, or banking
                  passwords. Transaction data such as payment status, order amount, and
                  transaction IDs are shared between us and Cashfree solely to process and
                  confirm your payment.
                </p>
                <p>
                  For queries related to payment processing, you may refer to Cashfree's
                  Privacy Policy at cashfree.com or contact them directly.
                </p>
              </div>
            </div>

            {/* 4 */}
            <div className="terms-of-use-item item-scroll-target" id="cookies">
              <h5 className="terms-of-use-title">4. Cookies &amp; Tracking Technologies</h5>
              <div className="terms-of-use-content">
                <p>
                  Our website uses cookies and similar technologies to enhance your
                  browsing experience. Cookies are small text files stored on your device
                  that help us recognise you and improve site functionality.
                </p>
                <p>
                  We use Essential Cookies (necessary for site functionality such as
                  session management and cart data), Analytics Cookies (to understand how
                  visitors interact with our site), Marketing Cookies (to deliver relevant
                  advertisements), and Preference Cookies (to remember your settings for a
                  personalised experience).
                </p>
                <p>
                  You may disable cookies through your browser settings; however, doing so
                  may affect the functionality of certain parts of our website.
                </p>
              </div>
            </div>

            {/* 5 */}
            <div className="terms-of-use-item item-scroll-target" id="data-sharing">
              <h5 className="terms-of-use-title">5. Data Sharing &amp; Disclosure</h5>
              <div className="terms-of-use-content">
                <p>
                  We do not sell, rent, or trade your personal information to third parties.
                  We may share your information only with logistics and delivery partners to
                  fulfil your orders; Cashfree Payments for secure transaction processing;
                  technology service providers operating under data processing agreements;
                  and legal authorities when required by law.
                </p>
                <p>
                  In the event of a merger, acquisition, or sale of business assets, your
                  data may be transferred to the successor entity under equivalent
                  protections.
                </p>
              </div>
            </div>

            {/* 6 */}
            <div className="terms-of-use-item item-scroll-target" id="data-retention">
              <h5 className="terms-of-use-title">6. Data Retention</h5>
              <div className="terms-of-use-content">
                <p>
                  We retain your personal information for as long as necessary to fulfil
                  the purposes for which it was collected. Order and transaction records are
                  retained for 7 years as required by Indian tax and accounting laws.
                  Customer account information is retained for the duration of your account
                  and up to 2 years after closure. Marketing consent records are retained
                  until you withdraw consent.
                </p>
                <p>
                  You may request deletion of your data by contacting us at
                  info@curve-comfort.com, subject to our legal obligations.
                </p>
              </div>
            </div>

            {/* 7 */}
            <div className="terms-of-use-item item-scroll-target" id="your-rights">
              <h5 className="terms-of-use-title">7. Your Rights</h5>
              <div className="terms-of-use-content">
                <p>
                  Under applicable Indian data protection laws, you have the right to
                  access a copy of the personal data we hold about you; the right to
                  request correction of inaccurate or incomplete data; the right to request
                  deletion of your personal data (subject to legal obligations); and the
                  right to withdraw marketing consent at any time by clicking 'unsubscribe'
                  or contacting us.
                </p>
                <p>
                  To exercise your rights, please write to info@curve-comfort.com with the
                  subject line "Data Privacy Request". We will respond within 30 days.
                </p>
              </div>
            </div>

            {/* 8 */}
            <div className="terms-of-use-item item-scroll-target" id="data-security">
              <h5 className="terms-of-use-title">8. Data Security</h5>
              <div className="terms-of-use-content">
                <p>
                  We implement appropriate technical and organisational security measures
                  to protect your personal information against unauthorised access,
                  disclosure, alteration, or destruction. These include SSL/TLS encryption
                  for all data transmitted through our website, secure access-controlled
                  servers with regular security audits, and staff training on data
                  protection obligations.
                </p>
                <p>
                  While we take every reasonable precaution, no method of transmission
                  over the internet is 100% secure. In the event of a data breach that
                  affects your rights, we will notify you as required by law.
                </p>
              </div>
            </div>

            {/* 9 */}
            <div className="terms-of-use-item item-scroll-target" id="third-party-links">
              <h5 className="terms-of-use-title">9. Third-Party Links</h5>
              <div className="terms-of-use-content">
                <p>
                  Our website may contain links to third-party websites, including social
                  media platforms and partner sites. We are not responsible for the privacy
                  practices of those websites and encourage you to review their privacy
                  policies before providing any personal information.
                </p>
                <p>
                  curve-comfort.com is not intended for use by individuals under the age
                  of 18. We do not knowingly collect personal information from minors. If
                  we become aware that a minor has submitted personal data, we will delete
                  it promptly.
                </p>
              </div>
            </div>

            {/* 10 */}
            <div className="terms-of-use-item item-scroll-target" id="grievance-officer">
              <h5 className="terms-of-use-title">10. Grievance Officer</h5>
              <div className="terms-of-use-content">
                <p>
                  In accordance with the Information Technology Act, 2000 and applicable
                  rules, a Grievance Officer has been designated to address data privacy
                  concerns. Grievances will be acknowledged within 48 hours and resolved
                  within 30 days of receipt.
                </p>
                <p>
                  <strong>Curve &amp; Comfort — Grievance Officer</strong>
                  <br />
                  Email: info@curve-comfort.com
                  <br />
                  Phone: +91 92891 66363
                  <br />
                  Website: curve-comfort.com
                </p>
              </div>
            </div>

            {/* 11 */}
            <div className="terms-of-use-item item-scroll-target" id="policy-changes">
              <h5 className="terms-of-use-title">11. Policy Changes</h5>
              <div className="terms-of-use-content">
                <p>
                  We may update this Privacy Policy from time to time. Any changes will be
                  posted on this page with a revised effective date. Continued use of our
                  website after changes are posted constitutes your acceptance of the
                  updated policy.
                </p>
                <p>
                  By using curve-comfort.com, you acknowledge that you have read and
                  understood this Privacy Policy and agree to its terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}