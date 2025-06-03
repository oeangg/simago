"use client";

import * as React from "react";
import { ChevronRight, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  Bot,
  Frame,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";

import { NavUserProfil } from "./nav-userProfil";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Payload } from "@/app/dashboard/layout";

// This is sample data.
export const data = {
  user: {
    name: "Admin",
    email: "m@example.com",
    avatar: "/avatar1.png",
  },

  sidebar: [
    {
      title: "Data Master",
      icon: SquareTerminal,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Data Material",
          url: "#",
        },
        {
          title: "Data Master 2",
          url: "#",
        },
      ],
    },
    {
      title: "Marketing",
      icon: Bot,
      url: "#",
      items: [
        {
          title: "Data Marketing satu",
          url: "#",
        },
        {
          title: "Data Marketing dua",
          url: "#",
        },
        {
          title: "Data Marketing tiga",
          url: "#",
        },
        {
          title: "Data Marketing empat",
          url: "#",
        },
        {
          title: "Data Marketing lima",
          url: "#",
        },
      ],
    },
    {
      title: "Data Finance",
      icon: BookOpen,
      url: "#",
      items: [
        {
          title: "Data finance satu",
          url: "#",
        },
        {
          title: "Data finance dua",
          url: "#",
        },
        {
          title: "Data finance tiga",
          url: "#",
        },
        {
          title: "Data finance empat",
          url: "#",
        },
      ],
    },
    {
      title: "Data Pengiriman",
      icon: Truck,
      url: "#",
      items: [
        {
          title: "Data Pengiriman satu",
          url: "#",
        },
        {
          title: "Data Pengiriman dua",
          url: "#",
        },
        {
          title: "Data Pengiriman tiga",
          url: "#",
        },
      ],
    },
    {
      title: "Laporan",
      icon: Frame,
      url: "#",
      items: [
        {
          title: "Laporan satu",
          url: "#",
        },
        {
          title: "Laporan dua",
          url: "#",
        },
        {
          title: "Laporan tiga",
          url: "#",
        },
        {
          title: "Laporan empat",
          url: "#",
        },
      ],
    },
    {
      title: "Pengaturan",
      icon: Settings2,
      url: "#",
      items: [
        {
          title: "Pengaturan satu",
          url: "#",
        },
        {
          title: "Manajemen User",
          url: "#",
        },
      ],
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  payload: Payload;
}

export function AppSidebar({ payload, ...props }: AppSidebarProps) {
  const router = useRouter();

  const { mutate: LogoutUser } = trpc.Auth.Logout.useMutation({
    onSuccess: () => {
      toast.success("Logout berhasil");
      router.push("/login");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  console.log(`SesionId di  Sidebar : ${payload.sessionId}`);
  const HandleLogout = () => {
    if (!payload.sessionId) return;

    LogoutUser({ sessionId: payload.sessionId });
  };
  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader className="flex flex-row gap-2">
        <Link href="/dashboard" className="w-full">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">My Application</span>
              <span className="truncate text-xs">v.2.2</span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarMenu>
            {data.sidebar.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <NavUserProfil user={payload} onCLickLogout={HandleLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
