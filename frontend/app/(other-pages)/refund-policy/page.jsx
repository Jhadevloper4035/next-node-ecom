import Footer1 from "@/components/footers/Footer1";
import Terms from "@/components/otherPages/Refund";
import React from "react";
import Link from "next/link";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("refund-policy", {
  title: "Refund and Return Policy | Curve & Comfort",
  description: "Review Curve & Comfort's refund and return policy, including cancellations and refund timelines.",
  canonical: "/refund-policy",
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
              <h1 className="heading text-center">Refund & Return Policy</h1>
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
                <li>Refund & Return Policy</li>
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
