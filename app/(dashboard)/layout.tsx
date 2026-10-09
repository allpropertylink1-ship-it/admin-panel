import { AuthGate } from "@/components/AuthGate";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DashboardHeader, SidebarProvider } from "@/components/DashboardHeader";
import { BottomNav } from "@/components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <SidebarProvider>
        <div className="flex max-w-full min-h-[100dvh] overflow-x-clip">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader />
            <main className="min-w-0 flex-1 p-4 pb-24 lg:p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
        <BottomNav />
      </SidebarProvider>
    </AuthGate>
  );
}
