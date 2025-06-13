"use client";

import React, { useEffect } from "react";
import { DashboardUserProfil } from "./dash-dropdownProfil";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { Payload } from "@/types/payload";

import { HeaderTitleAtom } from "@/lib/jotai";
import { data, SidebarData } from "@/constants/sidebar-item";
import { useAtom } from "jotai";

type DashboardHeaderProps = {
  payload: Payload;
};

const findTitleByPathname = (pathname: string, sidebarData: SidebarData) => {
  if (pathname === "/dashboard") {
    return "Dashboard";
  }
  for (const item of sidebarData.sidebar) {
    if (item.url && item.url === pathname) {
      return item.title;
    }
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.url === pathname) {
          return subItem.title;
        }
      }
    }
  }
  return null; // Tidak ditemukan
};

export const DashboardHeader = ({ payload }: DashboardHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentHeaderTitle, setHeaderTitle] = useAtom(HeaderTitleAtom);
  const { mutate: LogoutUser } = trpc.Auth.Logout.useMutation({
    onSuccess: () => {
      toast.success("Logout berhasil");
      router.push("/login");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    const titleFromPath = findTitleByPathname(pathname, data);
    if (titleFromPath) {
      setHeaderTitle(`Dashboard / ${titleFromPath}`);
    } else {
      setHeaderTitle("Dashboard");
    }
  }, [pathname, setHeaderTitle]);

  const HandleLogout = () => {
    if (!payload.sessionId) return;

    LogoutUser({ sessionId: payload.sessionId });
  };

  return (
    <div className="w-full flex flex-row justify-between items-center">
      <h1>{currentHeaderTitle}</h1>
      <DashboardUserProfil user={payload} onCLickLogout={HandleLogout} />
    </div>
  );
};
