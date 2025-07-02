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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200",
    textColor: "text-purple-700",
  },
  {
    value: "ADMIN",
    label: "Admin",
    icon: Shield,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
    textColor: "text-blue-700",
  },
  {
    value: "MANAGER",
    label: "Manager",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200",
    textColor: "text-emerald-700",
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    icon: UserCheck,
    color: "from-orange-500 to-yellow-500",
    bgColor: "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200",
    textColor: "text-orange-700",
  },
  {
    value: "USER",
    label: "User",
    icon: User,
    color: "from-gray-500 to-slate-500",
    bgColor: "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",
    textColor: "text-gray-700",
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
          className="border-2 border-slate-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-2 border-slate-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
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
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 rounded-xl"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Calendar className="mr-2 h-4 w-4 text-blue-500" />
          <span className="font-semibold text-slate-700">Registration</span>
          <ArrowUpDown className="ml-2 h-4 w-4 text-slate-500" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return (
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
        );
      }
      const date = new Date(row.original.createdAt);
      const daysPassed = Math.floor(
        (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      return (
        <div className="flex flex-col space-y-1.5 p-2 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm font-semibold text-slate-900">
              {date.toLocaleDateString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-600">
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
        <User className="h-4 w-4 text-purple-500" />
        <span className="font-semibold text-slate-700">Username</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <Skeleton className="h-12 w-40 rounded-lg" />;
      }
      const firstLetter = row.original.username.charAt(0).toUpperCase();
      const colors = [
        "from-purple-500 to-pink-500",
        "from-blue-500 to-cyan-500",
        "from-green-500 to-emerald-500",
        "from-orange-500 to-red-500",
        "from-indigo-500 to-purple-500",
      ];
      const colorIndex = row.original.username.charCodeAt(0) % colors.length;

      return (
        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white font-bold shadow-lg",
              colors[colorIndex]
            )}
          >
            {firstLetter}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 capitalize">
              {row.original.username}
            </span>
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
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 rounded-xl"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <UserCheck className="mr-2 h-4 w-4 text-green-500" />
          <span className="font-semibold text-slate-700">Full Name</span>
          <ArrowUpDown className="ml-2 h-4 w-4 text-slate-500" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <Skeleton className="h-6 w-48 rounded-lg" />;
      }
      return (
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
          <span className="font-medium text-slate-900 capitalize">
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
        <Mail className="h-4 w-4 text-blue-500" />
        <span className="font-semibold text-slate-700">Email</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <Skeleton className="h-8 w-56 rounded-lg" />;
      }
      const email = row.original.email;
      const [username, domain] = email!.split("@");

      return (
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-900">
              <span className="font-medium">{username}</span>
              <span className="text-slate-500">@{domain}</span>
            </span>
            {email!.endsWith(".com") && (
              <Badge
                variant="outline"
                className="w-fit text-xs mt-0.5 border-blue-200 text-blue-600"
              >
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
          <SelectTrigger className="w-[200px] border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 rounded-xl bg-gradient-to-r from-white to-slate-50">
            <SelectValue placeholder="🔄 Status Filter" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-2xl">
            <SelectItem
              value="All"
              className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                <span>All Status</span>
              </div>
            </SelectItem>
            <SelectItem
              value="true"
              className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Active Only</span>
              </div>
            </SelectItem>
            <SelectItem
              value="false"
              className="rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 cursor-pointer"
            >
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
      if (row.original.id.startsWith("skeleton-")) {
        return (
          <div className="flex flex-row items-center gap-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        );
      }
      const status = row.original.isActive;
      const isAdmin = row.original.role === Role.SUPER_ADMIN;
      const isLoading = editingStatusId === row.original.id;

      return (
        <div className="flex flex-row items-center gap-3">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl",
              status
                ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white"
                : "bg-gradient-to-r from-red-500 to-pink-500 border-red-400 text-white"
            )}
          >
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  status ? "bg-white" : "bg-white/70"
                )}
              />

              <span>{status ? "Active" : "Inactive"}</span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 p-0 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110",
                    isAdmin || isLoading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                  )}
                  size="icon"
                  disabled={isAdmin || isLoading}
                  onClick={() => onToggleStatus?.(row.original.id, !status)}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Pencil className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-xl border-0">
                <p className="font-medium text-sm">
                  {isAdmin
                    ? "🔒 Cannot modify Admin status"
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
          <SelectTrigger className="w-[200px] border-2 border-slate-200 hover:border-purple-400 transition-all duration-300 rounded-xl bg-gradient-to-r from-white to-purple-50">
            <SelectValue placeholder="👑 Role Filter" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-2xl">
            <SelectItem
              value="All"
              className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <span>All Roles</span>
              </div>
            </SelectItem>
            {RoleOptions.map((opt) => {
              const IconComponent = opt.icon;
              return (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-lg  hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className={cn("h-3 w-3", opt.textColor)} />
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
      if (row.original.id.startsWith("skeleton-")) {
        return (
          <div className="flex flex-row items-center gap-4">
            <Skeleton className="h-12 w-40 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        );
      }
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
        <div className="flex flex-row gap-3 rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 p-3 shadow-xl">
          <Select
            value={selectedRole}
            disabled={isLoading}
            onValueChange={(value) => handleChangeRole(value as Role)}
          >
            <SelectTrigger className="w-[160px] border-2 border-purple-300 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {RoleOptions.map((opt) => {
                const OptionIcon = opt.icon;
                return (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="rounded-lg cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-2">
                        <OptionIcon className="h-4 w-4" />
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
            className="border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
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
          <div
            className={cn(
              "flex items-center space-x-3 rounded-xl border-2 px-4 py-2.5 shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden group",
              currentRoleConfig?.bgColor,
              currentRoleConfig?.textColor
            )}
          >
            <div className="relative">
              <IconComponent className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <div
                className={cn(
                  "absolute -inset-1 rounded-full opacity-40 blur-sm bg-gradient-to-r",
                  currentRoleConfig?.color
                )}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">
                {currentRoleConfig?.label || role}
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 p-0 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110",
                    isLoading || isAdmin
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  )}
                  size="icon"
                  disabled={isLoading || isAdmin}
                  onClick={() => setEditing(true)}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Pencil className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-xl border-0">
                <p className="font-medium text-sm">
                  {isAdmin
                    ? "🔒 Cannot modify Admin role"
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
