import { Suspense } from "react";
import Footer1 from "@/components/footers/Footer1";
import ResetPassword from "@/components/otherPages/ResetPassword";

export const metadata = {
  title: "Reset Password || Modave",
};

export default function ResetPasswordPage() {
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <Suspense fallback={null}>
        <ResetPassword />
      </Suspense>
      <Footer1 />
    </>
  );
}
