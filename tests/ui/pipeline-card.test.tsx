import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/utils";
import { PipelineCard } from "@/components/app/PipelineCard";

const contact = {
  id: "contact-1",
  name: "Sofia Bergstrom",
  company: "Linear",
  confidence: "high" as const,
  lastActionAt: "2026-04-29T05:06:38.380Z",
};

describe("PipelineCard", () => {
  it("formats machine timestamps for the pipeline UI", () => {
    render(<PipelineCard contact={contact} />);

    expect(
      screen.queryByText("2026-04-29T05:06:38.380Z"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/ago|apr|today|yesterday/i)).toBeInTheDocument();
  });

  it("opens details from click and keyboard activation", () => {
    const onClick = vi.fn();
    render(<PipelineCard contact={contact} onClick={onClick} />);

    const card = screen.getByRole("button", {
      name: "View details for Sofia Bergstrom",
    });

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);

    card.focus();
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
