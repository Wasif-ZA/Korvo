"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  dismissable?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  dismissable = false,
  children,
  className,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleBackdropClick() {
    if (dismissable && onClose) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Desktop: centered modal */}
      <div
        className={cn(
          "relative hidden md:block w-full max-w-[440px] bg-white rounded-2xl p-8",
          "transition-all duration-200 ease-in-out",
          "animate-in fade-in zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 md:hidden bg-white rounded-t-2xl p-8",
          "transition-all duration-200 ease-in-out",
          "animate-in slide-in-from-bottom",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
