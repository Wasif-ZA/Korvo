"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLocked?: boolean;
}

export function ApiKeyInput({ label, value, onChange, placeholder, isLocked = false }: ApiKeyInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">
          {label}
        </label>
        {isLocked && (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent uppercase bg-accent-bg px-2 py-0.5 rounded border border-accent/10">
            <Lock className="w-3 h-3" /> Pro Only
          </span>
        )}
      </div>
      
      <div className="relative">
        <Input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLocked ? "Upgrade to Pro to use your own keys" : placeholder}
          disabled={isLocked}
          className="pr-12 font-mono text-sm"
        />
        {!isLocked && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
