import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import AccountSidebar from "@/components/my-account/AccountSidebar";
import Information from "@/components/my-account/Information";
import Orers from "@/components/my-account/Orers";
import Link from "next/link";
import React from "react";

export const metadata = {
  title:
    "My Account Orders || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function MyAccountOrdersPage() {
  return (
    <>
      <section className="flat-spacing">
        <div className="container">
          <div className="my-account-wrap">
            <AccountSidebar />
            <Orers />
          </div>
        </div>
      </section>
      <Footer1 />
    </>
  );
}
