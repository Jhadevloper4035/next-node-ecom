import Footer1 from "@/components/footers/Footer1";
import Terms from "@/components/otherPages/Privacy";
import React from "react";
import Link from "next/link";


export const metadata = {
  title: "Privacy Policy || Curve & Comfort - Premium Furniture Store",
  description:
    "Learn how Curve & Comfort (curve-comfort.com) collects, uses, and protects your personal data. Compliant with DPDPA 2023 and IT Act 2000.",
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
              <h3 className="heading text-center">Privacy Policy</h3>
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
                <li>Privacy Policy</li>
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
