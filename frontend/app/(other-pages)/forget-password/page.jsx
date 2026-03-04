import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import ForgotPass from "@/components/otherPages/ForgotPass";
import Link from "next/link";
import React from "react";

export const metadata = {
  title:
    "Forgot Password || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function ForgotPasswordPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <ForgotPass />
      <Footer1 />
    </>
  );
}
