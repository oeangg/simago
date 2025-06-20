import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { DashboardSidebarApp } from "@/components/Featured/Dashboard/DashboardSidebarApp";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/Featured/Dashboard/DashboardHeader";

interface PararelProps {
  children: ReactNode;
}

export type Payload = {
  sessionId: string;
  role: string;
  userId: string;
};

export default async function Layout({ children }: PararelProps) {
  const token = (await cookies()).get("__AingMaung")?.value;

  if (!token) {
    toast.error("Token tidak ditemukan");
    return;
  }

  const JWTSECRET = process.env.JWT_SECRET;

  if (!JWTSECRET) {
    toast.error("JWT secret belum di set di environment");
    return;
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(JWTSECRET)
  );

  return (
    <SidebarProvider>
      <DashboardSidebarApp payload={(payload as Payload) || undefined} />
      <main className="w-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background px-10">
          <div className="flex flex-row items-center gap-2">
            <SidebarTrigger />
          </div>
          <DashboardHeader payload={payload as Payload} />
        </div>

        {/*  Content */}
        <div className="flex-1 overflow-y-auto ">
          <div className="px-10 py-10">{children}</div>
        </div>
      </main>
    </SidebarProvider>
  );
}
