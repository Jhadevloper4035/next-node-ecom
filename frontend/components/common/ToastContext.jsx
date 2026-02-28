"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import "./toast.css";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-wrapper">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // fallback to no-op to avoid breaking when provider isn't mounted yet
    console.warn(
      "useToast called outside ToastProvider, toasts will be ignored",
    );
    return () => {};
  }
  return context.addToast;
}
