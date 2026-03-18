import Footer1 from "@/components/footers/Footer1";
import Terms from "@/components/otherPages/Refund";
import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Refund & Return Policy || Curve & Comfort - Premium Furniture Store",
  description:
    "Curve & Comfort offers a 7-day refund and return policy. Learn about cancellations, refund timelines via Cashfree Payments, and how to initiate a return.",
}


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
              <h3 className="heading text-center">Refund & Return Policy</h3>
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
