import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/featured/dashboard/sidebar-app";
import { ReactNode } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { toast } from "sonner";

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

  console.log(`TOKEN : ${token}`);
  console.log("PAYLOAD :", payload);

  return (
    <SidebarProvider>
      <AppSidebar payload={(payload as Payload) || undefined} />
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
