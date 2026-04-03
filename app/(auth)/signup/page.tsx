"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { MagicLinkSent } from "@/components/auth/MagicLinkSent";

export default function SignupPage() {
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  return (
    <AuthCard>
      {magicLinkSent ? (
        <MagicLinkSent />
      ) : (
        <>
          <AuthForm intent="signup" onMagicLinkSent={() => setMagicLinkSent(true)} />
          <div className="mt-8 text-center">
            <p className="text-sm text-text-body">
              Already have an account?{" "}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthCard>
  );
}
