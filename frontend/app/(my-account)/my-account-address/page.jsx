import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import AccountSidebar from "@/components/my-account/AccountSidebar";
import Address from "@/components/my-account/Address";
import Link from "next/link";
import React from "react";

export const metadata = {
  title:
    "My Account Address || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function MyAccountAddressPage() {
  return (
    <>
      <section className="flat-spacing">
        <div className="container">
          <div className="my-account-wrap">
            <AccountSidebar />
            <Address />
          </div>
        </div>
      </section>
      <Footer1 />
    </>
  );
}
