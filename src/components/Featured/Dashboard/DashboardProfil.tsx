"use client";

import { BadgeCheck, ChevronDown, CreditCard, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/app/_trpcClient/client";
import { Payload } from "@/app/dashboard/layout";

interface NavUserProfilProps {
  onCLickLogout: () => void;
  user: Payload;
}

export function DashboardUserProfil({
  onCLickLogout,
  user,
}: NavUserProfilProps) {
  const userId = user.userId;

  const { data: dataUser } = trpc.User.getUserbyId.useQuery({
    userId: userId,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="data-[state=open]:bg-sidebar-accent w-fit flex flex-row gap-2 py-1 px-2 border rounded-xl items-center data-[state=open]:text-sidebar-accent-foreground">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage
            src={dataUser?.profilPic ?? "/avatar1.png"}
            alt="avatar image"
          />
          <AvatarFallback className="rounded-lg">
            {dataUser?.fullname
              .split(" ")
              .map((kata) => kata.charAt(0))
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{dataUser?.fullname}</span>
        </div>
        <ChevronDown className="ml-auto size-4" />
        {/* </SidebarMenuButton> */}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg px-5 py-5
        "
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex flex-col items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={dataUser?.profilPic ?? "/avatar1.png"}
                alt="avatar image"
              />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-center text-sm leading-tight">
              <span className="truncate font-medium">{dataUser?.fullname}</span>
              <span className="truncate text-xs">{dataUser?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <BadgeCheck />
            Halaman dashboard
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <CreditCard />
            Pengaturan user
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCLickLogout} className="cursor-pointer">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
