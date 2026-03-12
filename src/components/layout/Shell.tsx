import { Sidebar } from "./Sidebar";
import { BottomBar } from "./BottomBar";
import { TopBar } from "./TopBar";

export const Shell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background-soft">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header (optional, for branding on mobile since there is no sidebar) */}
        <TopBar />

        <main className="flex-1 p-4 md:p-8 xl:max-w-7xl xl:mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomBar />
    </div>
  );
};
