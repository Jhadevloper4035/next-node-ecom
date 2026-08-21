"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import ToolbarBottom from "../headers/ToolbarBottom";
import ScrollTop from "../common/ScrollTop";
import styles from "./Footer1.module.css";

const columns = [
  {
    title: "Quick Links",
    links: [
      ["About Us", "/about-us"],
      ["Our Blog", "/blog-default"],
      ["Contact Us", "/contact"],
      ["Store Locations", "/store-list"],
    ],
  },
  {
    title: "Shop",
    links: [
      ["All Products", "/all-products"],
      ["Shop Furniture", "/shop-default-grid"],
      ["Shopping Cart", "/shopping-cart"],
      ["Wishlist", "/wish-list"],
      ["Compare Products", "/compare-products"],
    ],
  },
  {
    title: "My Account",
    links: [
      ["My Account", "/my-account"],
      ["My Orders", "/my-account-orders"],
      ["Order Tracking", "/order-tracking"],
      ["Login", "/login"],
      ["Create Account", "/register"],
    ],
  },
  {
    title: "Customer Care",
    links: [
      ["Contact Us", "/contact"],
      ["FAQs", "/FAQs"],
      ["Refund Policy", "/refund-policy"],
      ["Privacy Policy", "/privacy-policy"],
      ["Terms & Conditions", "/term-of-use"],
    ],
  },
];

const payments = [
  ["Visa", "/images/weaccepts/w23-pf-visa.webp"],
  ["Mastercard", "/images/weaccepts/w23-pf-master-card.webp"],
  ["American Express", "/images/weaccepts/w23-pf-american-express.webp"],
  ["RuPay", "/images/weaccepts/w23-pf-rupay.webp"],
  ["Wallet", "/images/weaccepts/w23-pf-wallet.webp"],
  ["Net Banking", "/images/weaccepts/w23-pf-net-banking.webp"],
];
const socials = [
  ["Instagram", "icon-instagram", ""],
  ["Facebook", "icon-fb", ""],
  ["Pinterest", "icon-pinterest", ""],
  ["LinkedIn", "", "in"],
  ["YouTube", "icon-youtube", ""],
];

export default function Footer1({ hasPaddingBottom = false }) {
  const { categories = [] } = useSelector((state) => state.category);
  const categoryLinks = categories.slice(0, 5).map((category) => [
    category.name,
    `/collections/${category.slug}`,
  ]);

  return (
    <>
      <footer className={styles.compactFooter}>
        <div className={styles.inner}>
          <div className={styles.linkGrid}>
            {columns.map((column) => (
              <section key={column.title} className={styles.column}>
                <h2>{column.title}</h2>
                {column.links.map(([label, href]) => (
                  <Link key={label} href={href}>{label}</Link>
                ))}
              </section>
            ))}
            <section className={styles.column}>
              <h2>Shop by Category</h2>
              {(categoryLinks.length ? categoryLinks : [["All Products", "/all-products"], ["Furniture Collection", "/shop-collection"], ["Shop by Category", "/shop-categories-top"], ["New Arrivals", "/shop-default-grid"]]).map(([label, href]) => (
                <Link key={label} href={href}>{label}</Link>
              ))}
            </section>
          </div>

          <div className={styles.discoveryGrid}>
            <section>
              <h2>Popular Categories</h2>
              <p>Living Room, Bedroom, Dining, Sofas, Beds, Chairs, Tables, Storage, Lighting and Home Decor.</p>
            </section>
            <section>
              <h2>Popular Brands</h2>
              <p>Curve & Comfort, Urban Living, Home Essentials, Comfort Craft, Modern Habitat and everyday furniture favourites.</p>
            </section>
            <section>
              <h2>Popular Cities</h2>
              <p>Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Ahmedabad, Jaipur and Kolkata.</p>
            </section>
          </div>

          <div className={styles.utilityRow}>
            <section>
              <h2>We accept</h2>
              <div className={styles.payments}>
                {payments.map(([name, src]) => <img key={name} src={src} alt={name} />)}
              </div>
            </section>
            <section className={styles.socialSection}>
              <h2>Like what you see? Follow us here</h2>
              <ul>
                {socials.map(([label, iconClass, mark]) => (
                  <li key={label}>
                    <a href="#" aria-label={label}>
                      {iconClass ? <i className={`icon ${iconClass}`} /> : <span>{mark}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className={styles.legalRow}>
            <div>
              <Link href="/">Home</Link>
              <Link href="/sitemap.xml">Sitemap</Link>
              <Link href="/term-of-use">Terms of Use</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/refund-policy">Refund Policy</Link>
            </div>
            <p>©{new Date().getFullYear()} Curve &amp; Comfort. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <ScrollTop hasPaddingBottom={hasPaddingBottom} />
      <ToolbarBottom />
    </>
  );
}
