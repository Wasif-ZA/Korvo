"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { MagicLinkSent } from "@/components/auth/MagicLinkSent";

export default function LoginPage() {
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  return (
    <AuthCard>
      {magicLinkSent ? (
        <MagicLinkSent />
      ) : (
        <>
          <AuthForm intent="login" onMagicLinkSent={() => setMagicLinkSent(true)} />
          <div className="mt-8 text-center">
            <p className="text-sm text-text-body">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthCard>
  );
}
