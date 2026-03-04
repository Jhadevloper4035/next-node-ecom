import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Login from "@/components/otherPages/Login";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Login || Modave - Multipurpose React Nextjs eCommerce Template",
  description: "Modave - Multipurpose React Nextjs eCommerce Template",
};

export default function LoginPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      {/* header2 will be inserted by RootLayout */}
      <Login />
      <Footer1 />
    </>
  );
}
