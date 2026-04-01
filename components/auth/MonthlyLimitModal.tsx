"use client";

// Monthly limit modal — shown when signed-in user hits 5 free searches
// Per D-05: Pro upsell only appears when user hits free tier limit
// Per D-06: hard block, no new searches until next month or upgrade

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface MonthlyLimitModalProps {
  open: boolean;
  onClose: () => void;
}

export function MonthlyLimitModal({ open, onClose }: MonthlyLimitModalProps) {
  const router = useRouter();

  function handleUpgrade() {
    router.push("/pricing");
  }

  return (
    <Modal isOpen={open} onClose={onClose} dismissable={true}>
      <h2 className="text-2xl font-semibold text-[#1C1C1A]">
        You&apos;ve used all 5 searches this month.
      </h2>
      <p className="text-base text-gray-500 mt-3">
        Your searches reset on the 1st. Upgrade to Pro for 50 searches per
        month.
      </p>
      <div className="mt-6">
        <Button variant="primary" className="w-full" onClick={handleUpgrade}>
          Upgrade to Pro — $19/month
        </Button>
      </div>
      <div className="mt-2">
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Remind me next month
        </Button>
      </div>
    </Modal>
  );
}
