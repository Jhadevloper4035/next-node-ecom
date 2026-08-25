import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Terms from "@/components/otherPages/Terms";
import React from "react";
import Link from "next/link";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("term-of-use", {
  title: "Terms and Conditions | Curve & Comfort",
  description: "Read Curve & Comfort terms and conditions for orders, payments, shipping, returns, and website use.",
  canonical: "/term-of-use",
});

export default function TermsOfUsePage() {
  return (
    <>
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center">Terms & Conditions</h1>
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
                <li>Terms & Conditions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Terms />
      <Footer1 />
    </>
  );
}
