"use client";

import { toast, ToastContainer } from "react-toastify";

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick
        pauseOnFocusLoss
        draggable
        theme="light"
      />
    </>
  );
}

export function useToast() {
  return (message, type = "info", duration = 3000) =>
    (toast[type] || toast.info)(message, { autoClose: duration });
}
