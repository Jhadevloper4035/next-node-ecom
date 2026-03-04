import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import ResetPassword from "@/components/otherPages/ResetPassword";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Reset Password || Modave",
};

export default function ResetPasswordPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <ResetPassword />
      <Footer1 />
    </>
  );
}
