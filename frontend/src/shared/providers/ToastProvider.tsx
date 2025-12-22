"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Toaster, toast as sonnerToast } from "sonner";

interface ToastContextType {
  toast: typeof sonnerToast;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ toast: sonnerToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}