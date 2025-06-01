import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/view/dashboard/sidebar-app";
import { ReactNode } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface PararelProps {
  children: ReactNode;
}

export default async function Layout({ children }: PararelProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex h-16 w-full items-center justify-between border-b px-10">
          <div className="flex flex-row items-center gap-2">
            <SidebarTrigger />
          </div>
          <Avatar className="h-12 w-12 border p-1">
            <AvatarImage src="/avatar1.png" alt="Avatar" />
          </Avatar>
        </div>
        <div className="px-10 py-10">{children}</div>
      </main>
    </SidebarProvider>
  );
}
