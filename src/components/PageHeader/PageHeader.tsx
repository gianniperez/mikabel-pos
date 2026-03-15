import { RefreshCw } from "lucide-react";
import type { PageHeaderProps } from "./PageHeader.types";

export function PageHeader({
  title,
  description,
  onReload,
  actionButton,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex align-items-center align-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h1>
          <div className="block md:hidden">
            {onReload && (
              <button
                onClick={onReload}
                className="cursor-pointer p-3 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                title="Sincronizar"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-500">{description}</p>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="hidden md:block">
          {onReload && (
            <button
              onClick={onReload}
              className="cursor-pointer p-3 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
              title="Sincronizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
        {actionButton && <div className="w-full md:w-auto">{actionButton}</div>}
      </div>
    </div>
  );
}
