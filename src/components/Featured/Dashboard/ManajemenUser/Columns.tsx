"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Crown,
  Loader2,
  Mail,
  Pencil,
  Shield,
  Sparkles,
  User,
  X,
  Calendar,
  Clock,
  UserCheck,
} from "lucide-react";

import { IUser } from "@/types/user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { Role } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BadgeChartAt } from "@/components/ui/badgeChartAt";

export interface IUserProps extends IUser {
  createdAt: Date;
  isActive: boolean;
}

type StatusColumnProps = {
  onToggleStatus?: (id: string, newStatus: boolean) => void;
  editingStatusId: string | null;
};

const RoleOptions = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    icon: Crown,
  },
  {
    value: "ADMIN",
    label: "Admin",
    icon: Shield,
  },
  {
    value: "MANAGER",
    label: "Manager",
    icon: Sparkles,
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    icon: UserCheck,
  },
  {
    value: "USER",
    label: "User",
    icon: User,
  },
] as const;

type RoleColumnProps = {
  onUpdateRole: (id: string, newRole: Role) => void | Promise<void>;
  editingRoleId: string | null;
};

export const manUserbaseColumn: ColumnDef<IUserProps>[] = [
  // Checkbox Column
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Registration Date Column
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Registration</span>
          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      const daysPassed = Math.floor(
        (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      return (
        <div className="flex flex-col space-y-1.5 p-2 rounded-md ">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {date.toLocaleDateString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {daysPassed === 0
                ? "Today"
                : daysPassed === 1
                ? "Yesterday"
                : `${daysPassed} days ago`}
            </Badge>
          </div>
        </div>
      );
    },
  },
  // Username Column
  {
    accessorKey: "username",
    header: () => (
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">Username</span>
      </div>
    ),
    cell: ({ row }) => {
      const firstLetter = row.original.username.charAt(0).toUpperCase();

      return (
        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
          <BadgeChartAt>{firstLetter}</BadgeChartAt>
          <div className="flex flex-col">
            <span className="font-medium ">{row.original.username}</span>
          </div>
        </div>
      );
    },
  },
  // Fullname Column
  {
    accessorKey: "fullname",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Full Name</span>
          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          <span className="font-medium capitalize">
            {row.original.fullname}
          </span>
        </div>
      );
    },
  },
  // Email Column
  {
    accessorKey: "email",
    header: () => (
      <div className="flex items-center space-x-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">Email</span>
      </div>
    ),
    cell: ({ row }) => {
      const email = row.original.email;
      const [username, domain] = email!.split("@");

      return (
        <div className="flex items-center space-x-3 p-2 rounded-md ">
          <BadgeChartAt>
            <Mail className="h-4 w-4 text-primary-foreground" />
          </BadgeChartAt>

          <div className="flex flex-col">
            <span className="text-sm">
              <span className="font-medium">{username}</span>
              <span className="text-muted-foreground">@{domain}</span>
            </span>
            {email!.endsWith(".com") && (
              <Badge variant="outline" className="w-fit text-xs mt-0.5">
                Verified
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
];

export function ManUserStatusColumn({
  onToggleStatus,
  editingStatusId,
}: StatusColumnProps): ColumnDef<IUserProps> {
  return {
    accessorKey: "isActive",
    header: ({ table, column }) => {
      const filterValue = table.getColumn("isActive")?.getFilterValue() as
        | string
        | undefined;

      const handleFilterChange = (value: string) => {
        if (value === "All") {
          table.getColumn(column.id)?.setFilterValue(undefined);
        } else {
          table.getColumn(column.id)?.setFilterValue(value === "true");
        }
      };

      return (
        <Select
          value={filterValue === undefined ? "All" : String(filterValue)}
          onValueChange={handleFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                <span>All Status</span>
              </div>
            </SelectItem>
            <SelectItem value="true">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Active Only</span>
              </div>
            </SelectItem>
            <SelectItem value="false">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Inactive Only</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },
    cell: ({ row }) => {
      const status = row.original.isActive;
      const isAdmin = row.original.role === Role.SUPER_ADMIN;
      const isLoading = editingStatusId === row.original.id;

      return (
        <div className="flex flex-row items-center gap-3">
          <div
            className={cn(
              "relative overflow-hidden rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              status
                ? "bg-green-100 border-green-200 text-green-800"
                : "bg-red-100 border-red-200 text-red-800"
            )}
          >
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  status ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span>{status ? "Active" : "Inactive"}</span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10",
                    isAdmin || isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary hover:text-primary-foreground"
                  )}
                  disabled={isAdmin || isLoading}
                  onClick={() => onToggleStatus?.(row.original.id, !status)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isAdmin
                    ? "Cannot modify Admin status"
                    : `Click to ${status ? "deactivate" : "activate"} user`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === undefined) return true;
      return row.getValue(columnId) === filterValue;
    },
  };
}

export function ManUserRoleColumn({
  onUpdateRole,
  editingRoleId,
}: RoleColumnProps): ColumnDef<IUserProps> {
  return {
    accessorKey: "role",
    header: ({ table, column }) => {
      const filterValue = table.getColumn("role")?.getFilterValue() as
        | string
        | undefined;

      const handleFilterChange = (value: string) => {
        table
          .getColumn(column.id)
          ?.setFilterValue(value === "All" ? undefined : value);
      };

      return (
        <Select value={filterValue || "All"} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <span>All Roles</span>
              </div>
            </SelectItem>
            {RoleOptions.map((opt) => {
              const IconComponent = opt.icon;
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-3 w-3 text-muted-foreground" />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    },
    cell: ({ row }) => {
      return (
        <RoleCell
          role={row.original.role}
          rowId={row.original.id}
          onUpdate={onUpdateRole}
          isLoading={editingRoleId === row.original.id}
          isAdmin={row.original.role.includes("ADMIN")}
        />
      );
    },
  };
}

function RoleCell({
  role,
  rowId,
  onUpdate,
  isAdmin,
  isLoading,
}: {
  role: Role;
  rowId: string;
  isAdmin: boolean;
  isLoading: boolean;
  onUpdate: (id: string, newRole: Role) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(role);

  const currentRoleConfig = RoleOptions.find((r) => r.value === role);
  const IconComponent = currentRoleConfig?.icon || User;

  const handleChangeRole = async (newRole: Role) => {
    setSelectedRole(newRole);
    try {
      await onUpdate(rowId, newRole);
      setEditing(false);
    } catch (error) {
      console.log(error);
      setSelectedRole(role);
    }
  };

  return (
    <div className="flex flex-row items-center gap-4">
      {editing ? (
        <div className="flex flex-row gap-3 rounded-md border  p-3">
          <Select
            value={selectedRole}
            disabled={isLoading}
            onValueChange={(value) => handleChangeRole(value as Role)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RoleOptions.map((opt) => {
                const OptionIcon = opt.icon;
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-2">
                        <OptionIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{opt.label}</span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(false);
              setSelectedRole(role);
            }}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-3 rounded-md border bg-muted/50 px-4 py-2.5">
            <IconComponent className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {currentRoleConfig?.label || role}
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10",
                    isLoading || isAdmin
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary hover:text-primary-foreground"
                  )}
                  disabled={isLoading || isAdmin}
                  onClick={() => setEditing(true)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isAdmin
                    ? "Cannot modify Admin role"
                    : "Click to change user role"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}
