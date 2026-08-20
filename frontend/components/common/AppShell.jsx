"use client";

import { Suspense, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import CartModal from "@/components/modals/CartModal";
import QuickView from "@/components/modals/QuickView";
import QuickAdd from "@/components/modals/QuickAdd";
import Compare from "@/components/modals/Compare";
import MobileMenu from "@/components/modals/MobileMenu";
import SearchModal from "@/components/modals/SearchModal";
import SizeGuide from "@/components/modals/SizeGuide";
import Wishlist from "@/components/modals/Wishlist";
import DemoModal from "@/components/modals/DemoModal";
import Categories from "@/components/modals/Categories";
import RtlToggler from "@/components/common/RtlToggler";
import AccountSidebar from "@/components/modals/AccountSidebar";
import AuthHydrator from "@/components/common/AuthHydrator";
import { ToastProvider } from "@/components/common/ToastContext";
import Header from "@/components/headers/Header2";
import GlobalSpinner from "@/components/common/GlobalSpinner";
import CartPersistence from "@/components/common/CartPersistence";

export default function AppShell({ children }) {
  const [scrollDirection, setScrollDirection] = useState("up");

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.esm");
  }, []);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("app-route-change"));
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("app-route-change"));
      return result;
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector("header");
      if (!header) return;

      if (window.scrollY > 100) {
        header.classList.add("header-bg");
      } else {
        header.classList.remove("header-bg");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const lastScrollY = { current: window.scrollY };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 250) {
        setScrollDirection(currentScrollY > lastScrollY.current ? "down" : "up");
      } else {
        setScrollDirection("down");
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const hideOpenOverlays = () => {
      const bootstrap = require("bootstrap");

      document.querySelectorAll(".modal.show").forEach((modal) => {
        bootstrap.Modal.getInstance(modal)?.hide();
      });

      document.querySelectorAll(".offcanvas.show").forEach((offcanvas) => {
        bootstrap.Offcanvas.getInstance(offcanvas)?.hide();
      });
    };

    window.addEventListener("app-route-change", hideOpenOverlays);
    window.addEventListener("popstate", hideOpenOverlays);

    return () => {
      window.removeEventListener("app-route-change", hideOpenOverlays);
      window.removeEventListener("popstate", hideOpenOverlays);
    };
  }, []);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    header.style.top = scrollDirection === "up" ? "0px" : "-185px";
  }, [scrollDirection]);

  useEffect(() => {
    const WOW = require("@/utlis/wow");
    const initWow = () => {
      const wow = new WOW.default({
        mobile: false,
        live: false,
      });
      wow.init();
    };

    initWow();
    window.addEventListener("app-route-change", initWow);
    window.addEventListener("popstate", initWow);

    return () => {
      window.removeEventListener("app-route-change", initWow);
      window.removeEventListener("popstate", initWow);
    };
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        <GlobalSpinner />
        <Suspense fallback={null}>
          <AuthHydrator />
        </Suspense>
        <CartPersistence />
        <RtlToggler />
        <Header />
        <div id="wrapper">{children}</div>
        <CartModal />
        <QuickView />
        <QuickAdd />
        <Compare />
        <MobileMenu />
        <SearchModal />
        <SizeGuide />
        <Wishlist />
        <DemoModal />
        <Categories />
        <AccountSidebar />
      </ToastProvider>
    </Provider>
  );
}
