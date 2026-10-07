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
        <div className="flex max-w-full min-h-[100dvh] overflow-x-clip lg:pb-0 pb-16">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader />
            <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
        <BottomNav />
      </SidebarProvider>
    </AuthGate>
  );
}
