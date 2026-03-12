export type PageHeaderProps = {
  title: string;
  description: string | React.ReactNode;
  onReload?: () => void;
  actionButton?: React.ReactNode;
};
