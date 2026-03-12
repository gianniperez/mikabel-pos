import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PosTabSwitcher } from "./PosTabSwitcher";

describe("PosTabSwitcher Component", () => {
  it("renders correctly", () => {
    const { container } = render(<PosTabSwitcher />);
    expect(container).toBeInTheDocument();
  });
});
