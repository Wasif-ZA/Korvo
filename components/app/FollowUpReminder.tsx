"use client";

import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

interface FollowUpReminderProps {
  contactId: string;
  initialReminderSet?: boolean;
}

export function FollowUpReminder({
  contactId,
  initialReminderSet = false,
}: FollowUpReminderProps) {
  const [isSet, setIsSet] = useState(initialReminderSet);
  const [isLoading, setIsLoading] = useState(false);

  const toggleReminder = async () => {
    setIsLoading(true);
    const newStatus = !isSet;

    try {
      const res = await fetch(`/api/contacts/${contactId}/reminder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderActive: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update reminder");

      setIsSet(newStatus);

      if (newStatus) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 7);
        const formatted = reminderDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        toast.success(`Reminder set for ${formatted}`);
      } else {
        toast.success("Follow-up reminder removed");
      }
    } catch {
      toast.error("Couldn't set reminder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-surface border border-border-card rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${isSet ? "bg-success-bg text-success" : "bg-surface-alt text-text-muted"}`}
        >
          <Clock className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-text-primary">
            {isSet ? "Follow-up Scheduled" : "Set Follow-up"}
          </p>
          <p className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-wider">
            {isSet ? "REMIND_IN_7_DAYS" : "NO_REMINDER_SET"}
          </p>
        </div>
      </div>

      <Button
        variant={isSet ? "outline" : "primary"}
        size="sm"
        onClick={toggleReminder}
        isLoading={isLoading}
        className="h-9 px-4"
      >
        {isSet ? (
          <>
            <Check className="w-3.5 h-3.5 mr-2" />
            Active
          </>
        ) : (
          "Remind Me"
        )}
      </Button>
    </div>
  );
}
