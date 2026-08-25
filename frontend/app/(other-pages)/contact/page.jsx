import Footer1 from "@/components/footers/Footer1";
import Contact3 from "@/components/otherPages/Contact3";
import React from "react";
import Link from "next/link";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("contact", {
  title: "Contact Curve & Comfort | Furniture Support",
  description: "Contact Curve & Comfort for product questions, order support, and help choosing furniture for your home.",
  canonical: "/contact",
});

export default function ContactPage2() {
  return (
    <>
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center">Contact Us</h1>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>
                  <a className="link" href="#">
                    Pages
                  </a>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <main className="contact-page">
        <Contact3 />
      </main>

      <Footer1 />
    </>
  );
}
