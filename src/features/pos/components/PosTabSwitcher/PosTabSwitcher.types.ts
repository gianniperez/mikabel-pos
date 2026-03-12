export type PosTab = "products" | "cart";

export type PosTabSwitcherProps = {
  activeTab: PosTab;
  onTabChange: (tab: PosTab) => void;
  itemCount: number;
};
