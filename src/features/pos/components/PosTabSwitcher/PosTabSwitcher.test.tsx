import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PosTabSwitcher } from "./PosTabSwitcher";

describe("PosTabSwitcher Component", () => {
  it("renders correctly", () => {
    const { container } = render(
      <PosTabSwitcher
        activeTab="products"
        onTabChange={() => {}}
        itemCount={0}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
