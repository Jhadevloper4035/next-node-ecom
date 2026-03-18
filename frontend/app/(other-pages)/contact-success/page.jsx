import Footer1 from "@/components/footers/Footer1";
import ThankYouContact from "@/components/otherPages/ThankYouContact";
import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Contact Success || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function ContactSuccessPage() {
  return (
    <>
      <ThankYouContact />

      <Footer1 />
    </>
  );
}
