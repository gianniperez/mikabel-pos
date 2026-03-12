import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InventoryWidget } from "./InventoryWidget";

describe("InventoryWidget Component", () => {
  it("renders correctly", () => {
    const { container } = render(<InventoryWidget />);
    expect(container).toBeInTheDocument();
  });
});
