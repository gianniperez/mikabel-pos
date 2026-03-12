import { Shell } from "@/components/layout/Shell";
import { PosSyncProvider } from "@/features/pos/hooks/usePosSyncLoop";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Shell>
      {/* Inicializamos el daemon que vigila y procesa la cola de tickets del POS */}
      <PosSyncProvider />
      {children}
    </Shell>
  );
}
