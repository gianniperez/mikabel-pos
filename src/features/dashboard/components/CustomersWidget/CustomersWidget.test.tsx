import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CustomersWidget } from "./CustomersWidget";

describe("CustomersWidget Component", () => {
  it("renders correctly", () => {
    const { container } = render(<CustomersWidget />);
    expect(container).toBeInTheDocument();
  });
});
