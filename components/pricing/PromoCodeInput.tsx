"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PromoCodeInputProps {
  onCodeApplied: (code: string) => void;
}

export function PromoCodeInput({ onCodeApplied }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter a promo code.");
      return;
    }
    // Actual Stripe validation in Plan 05 — store code locally for now
    setError("");
    setApplied(true);
    onCodeApplied(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value);
    if (applied) {
      setApplied(false);
    }
    if (error) {
      setError("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[#1C1C1A]">
        Have a promo code?
      </label>
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <Input
            placeholder="e.g. UTSBDSOC"
            value={code}
            onChange={handleChange}
            error={error}
            disabled={applied}
            aria-label="Promo code"
          />
        </div>
        {!applied ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleApply}
            className="shrink-0"
          >
            Apply
          </Button>
        ) : (
          <div className="inline-flex items-center gap-1 h-11 px-3 text-sm font-semibold text-teal-600 shrink-0">
            <Check className="h-4 w-4" aria-hidden="true" />
            Code applied
          </div>
        )}
      </div>
    </div>
  );
}
