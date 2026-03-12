import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CashSessionWidget } from "./CashSessionWidget";

describe("CashSessionWidget Component", () => {
  it("renders correctly", () => {
    const { container } = render(<CashSessionWidget />);
    expect(container).toBeInTheDocument();
  });
});
