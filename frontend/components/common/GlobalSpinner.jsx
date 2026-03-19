"use client";

import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import styles from "./GlobalSpinner.module.css";

export default function GlobalSpinner() {
  const loadingCount = useSelector((state) => state.ui.loadingCount);
  const isInitialLoading = useSelector((state) => state.ui.isInitialLoading);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // If we're still in the initial loading phase or currently fetching, definitely show it.
    if (isInitialLoading || loadingCount > 0) {
      setShow(true);
    } else {
      // Small buffer to bridge gaps between multiple sequential API calls
      const timer = setTimeout(() => {
        setShow(false);
      }, 500); // Wait 500ms before hiding the full-page loader
      return () => clearTimeout(timer);
    }
  }, [loadingCount, isInitialLoading]);

  if (!show) return null;

  return (
    <div className={styles.spinnerOverlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
}
