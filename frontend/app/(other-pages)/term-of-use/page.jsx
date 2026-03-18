import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Terms from "@/components/otherPages/Terms";
import React from "react";
import Link from "next/link";
export const metadata = {
  title: "Terms & Conditions || Curve & Comfort - Premium Furniture Store",
  description: "Read the Terms and Conditions for Curve & Comfort (curve-comfort.com). Understand our policies on orders, payments via Cashfree, shipping, returns, and more.",
};

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
              <h3 className="heading text-center">Terms & Conditions</h3>
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
