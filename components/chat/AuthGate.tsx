"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AuthGateProps {
  onLogin: () => void;
  isLoading?: boolean;
}

export function AuthGate({ onLogin, isLoading }: AuthGateProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-text-primary">
              Sign in to continue
            </h3>
            <p className="text-[12px] text-text-muted">
              Free searches used up — sign in for more
            </p>
          </div>
        </div>

        <Button
          onClick={onLogin}
          variant="primary"
          className="w-full h-11 text-[13px] font-bold uppercase tracking-wider"
          isLoading={isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-[11px] text-text-muted text-center mt-4">
          We only use your email for authentication.{" "}
          <a href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
