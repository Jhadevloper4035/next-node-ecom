import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Faqs from "@/components/otherPages/Faqs";
import React from "react";
import Link from "next/link";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("faqs", {
  title: "Frequently Asked Questions | Curve & Comfort",
  description: "Find answers to common questions about Curve & Comfort products, orders, delivery, returns, and support.",
  canonical: "/FAQs",
});

export default function FAQSPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" />
       */}
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center">FAQs</h1>
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
                <li>FAQs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Faqs />
      <Footer1 />
    </>
  );
}
