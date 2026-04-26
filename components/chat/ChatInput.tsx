"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={
          placeholder || "Try: Find contacts at Stripe for Engineering Manager"
        }
        className="flex-1 resize-none bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: "48px", maxHeight: "120px" }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className="h-12 w-12 flex items-center justify-center rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        aria-label="Send message"
      >
        <Send className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
