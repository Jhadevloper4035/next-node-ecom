"use client";

import { useSelector } from "react-redux";
import styles from "./GlobalSpinner.module.css";

export default function GlobalSpinner() {
  const isLoading = useSelector((state) => state.ui.loadingCount > 0);

  if (!isLoading) return null;


  return (
    <div className={styles.spinnerOverlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );
}
