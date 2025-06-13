"use client";

import * as React from "react";
import { ChevronRight, GalleryVerticalEnd, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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

import Link from "next/link";

import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Payload } from "@/app/dashboard/layout";
import { data, SidebarItem } from "@/constants/sidebar-item";
import { useSetAtom } from "jotai";
import { HeaderTitleAtom } from "@/lib/jotai";

// This is sample data.

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  payload: Payload;
}

export function AppSidebar({ payload, ...props }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const setHeaderTitle = useSetAtom(HeaderTitleAtom);

  const { mutate: LogoutUser } = trpc.Auth.Logout.useMutation({
    onSuccess: () => {
      toast.success("Logout berhasil");
      router.push("/login");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const HandleLogout = () => {
    if (!payload.sessionId) return;

    LogoutUser({ sessionId: payload.sessionId });
  };

  const dataFilteredItem = data.sidebar.filter((item: SidebarItem) => {
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(payload.role);
    }

    return true;
  });

  const handleSubItemClick = (subItemTitle: string, subItemUrl: string) => {
    setHeaderTitle(`Dashboard / ${subItemTitle}`);
    router.push(subItemUrl);
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
              <span className="truncate tracking-wider font-medium uppercase">
                Simago
              </span>
              <span className="truncate text-xs">v.0.0.1</span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarMenu>
            {dataFilteredItem.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={
                  item.isActive ||
                  item.items?.some((subItem) =>
                    pathname.startsWith(subItem.url)
                  )
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={
                        item.items?.some((subItem) =>
                          pathname.startsWith(subItem.url)
                        )
                          ? " font-medium"
                          : ""
                      }
                    >
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
                            <Link
                              href={subItem.url}
                              onClick={() =>
                                handleSubItemClick(subItem.title, subItem.url)
                              }
                              className={
                                pathname.startsWith(subItem.url)
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : ""
                              }
                            >
                              <span>{subItem.title}</span>
                            </Link>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={HandleLogout}>
              <LogOut />
              Log out
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
