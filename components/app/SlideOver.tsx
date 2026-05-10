"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  children,
}: SlideOverProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close details overlay"
        className="absolute inset-0 bg-text-primary/20"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl",
          "animate-in slide-in-from-right duration-200",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close details"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-8">{children}</div>
      </aside>
    </div>
  );
}
