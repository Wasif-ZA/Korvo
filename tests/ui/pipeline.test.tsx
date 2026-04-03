import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/utils";
import { Pipeline } from "@/components/marketing/Pipeline";

describe("Pipeline section", () => {
  it("renders all pipeline stage headings", () => {
    render(<Pipeline />);

    expect(screen.getByText("Find the right people")).toBeInTheDocument();
    expect(screen.getByText("Research what matters to them")).toBeInTheDocument();
    expect(screen.getByText("Draft something worth reading")).toBeInTheDocument();
  });
});
