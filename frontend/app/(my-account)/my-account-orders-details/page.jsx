import Footer1 from "@/components/footers/Footer1";
import AccountSidebar from "@/components/my-account/AccountSidebar";
import OrderDetails from "@/components/my-account/OrderDetails";

export const metadata = {
  title: "Order Details | Curve & Comfort",
  description: "View your Curve & Comfort order details.",
};

export const dynamic = "force-dynamic";

export default function MyAccountOrdersDetailsPage() {
  return (
    <>
      <section className="flat-spacing">
        <div className="container">
          <div className="my-account-wrap">
            <AccountSidebar />
            <OrderDetails />
          </div>
        </div>
      </section>
      <Footer1 />
    </>
  );
}
