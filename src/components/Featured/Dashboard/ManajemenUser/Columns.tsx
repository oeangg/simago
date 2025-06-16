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
  Check,
  Crown,
  Hash,
  Loader2,
  Pencil,
  Shield,
  Sparkles,
  User,
  X,
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

export interface IUserProps extends IUser {
  createdAt: Date;
  isActive: boolean;
}

type statusColumnProps = {
  onToggleStatus?: (id: string, newStatus: boolean) => void;
  editingStatusId: string | null;
};

const RoleOpsi = [
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
    icon: User,
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

// type Role = (typeof RoleOpsi)[number]["value"];

type RoleColumnProps = {
  onUpdateRole: (id: string, newRole: Role) => void | Promise<void>;
  editingRoleId: string | null;
};

export const manUserbaseColumn: ColumnDef<IUserProps>[] = [
  {
    accessorKey: "rowIndex",
    header: () => (
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <Hash className="h-4 w-4" />
        <span>No.</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const filteredRows = table.getFilteredRowModel().rows;
      const currentRowIndex = filteredRows.findIndex(
        (filteredRows) => filteredRows.id === row.id
      );
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
          {currentRowIndex + 1}
        </div>
      );
    },
  },
  {
    accessorKey: "createAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span className="font-semibold text-slate-700 ">Register</span>
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
      const date = new Date(row.original.createdAt); // Ambil nilai dari data

      // const formater = new Intl.DateTimeFormat("id-ID", {
      //   dateStyle: "medium",
      //   timeStyle: "short",
      // });
      return (
        <div className="flex flex-col space-y-1">
          <div className="text-sm font-medium text-slate-900">
            {date.toLocaleDateString("id-ID")}
          </div>
          <div className="text-xs text-slate-500">
            {date.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: () => (
      <span className="font-semibold text-slate-700">Username</span>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <Skeleton className="h-4 w-32 rounded-lg" />;
      }
      return (
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg">
            {row.original.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-900 capitalize">
            {row.original.username}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "fullname",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span className="font-semibold text-slate-700">Fullname</span>
          <ArrowUpDown className="ml-2 h-4 w-4 text-slate-500" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <Skeleton className="h-4 w-32 rounded-lg" />;
      }
      return (
        <span className="font-medium text-slate-900 capitalize">
          {row.original.fullname}
        </span>
      );
    },
  },

  {
    accessorKey: "email",
    header: () => <span className="font-semibold text-slate-700">Email</span>,
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <Skeleton className="h-4 w-48 rounded-lg" />;
      }
      return (
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-gradient-to-r from-green-400 to-blue-500 p-1">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <span className="text-slate-700">{row.original.email}</span>
        </div>
      );
    },
  },
];

export function ManUserStatusColumn({
  onToggleStatus,
  editingStatusId,
}: statusColumnProps): ColumnDef<IUserProps> {
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
          value={filterValue === undefined ? "" : String(filterValue)}
          onValueChange={handleFilterChange}
        >
          <SelectTrigger className="w-[180px] border-2 border-slate-200 hover:border-blue-400 transition-colors duration-300 rounded-xl">
            <SelectValue placeholder="🔄 Status Aktif" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-xl">
            <SelectItem
              value="All"
              className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
            >
              📊 Semua Status
            </SelectItem>
            <SelectItem
              value="true"
              className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50"
            >
              ✅ Aktif
            </SelectItem>
            <SelectItem
              value="false"
              className="rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50"
            >
              ❌ Tidak Aktif
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },

    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return (
          <div className="flex flex-row items-center gap-4">
            <Skeleton className="h-8 w-24 rounded-xl" />
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
              "relative overflow-hidden rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-300 shadow-md",
              status
                ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white shadow-green-200"
                : "bg-gradient-to-r from-red-500 to-pink-500 border-red-400 text-white shadow-red-200"
            )}
          >
            <div className="flex items-center space-x-2">
              {status ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">
                {status ? "Active" : "Non Active"}
              </span>
            </div>
            <div
              className={cn(
                "absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-1000",
                status && "animate-pulse"
              )}
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 p-0 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110",
                    isAdmin || isLoading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:text-blue-200"
                  )}
                  size="icon"
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
              <TooltipContent className=" bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-xl">
                <p className="font-medium">
                  {isAdmin
                    ? "🔒 Tidak bisa mengubah status Admin"
                    : "✏️ Ubah Status"}
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
        <Select value={filterValue || ""} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px] border-2 border-slate-200 hover:border-purple-400 transition-colors duration-300 rounded-xl">
            <SelectValue placeholder="👑 Role" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-xl">
            <SelectItem
              value="All"
              className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
            >
              🎭 Semua Role
            </SelectItem>
            {RoleOpsi.map((opt) => {
              const IconComponent = opt.icon;
              return (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
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
            <Skeleton className="h-10 w-32 rounded-xl" />
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

  const currentRoleConfig = RoleOpsi.find((r) => r.value === role);
  const IconComponent = currentRoleConfig?.icon || User;

  const handleChangeRole = async (newRole: Role) => {
    setSelectedRole(newRole);
    try {
      await onUpdate(rowId, newRole);
      setEditing(false);
    } finally {
    }
  };

  return (
    <div className="flex flex-row items-center gap-4">
      {editing ? (
        <div className="flex flex-row gap-3 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3 shadow-lg">
          <Select
            value={selectedRole}
            disabled={isLoading}
            onValueChange={(value) => handleChangeRole(value as Role)}
          >
            <SelectTrigger className="w-[140px] border-2 border-purple-300 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {RoleOpsi.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{opt.label}</span>
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
          >
            <X className="h-4 w-4 mr-1" />
            Batal
          </Button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "flex items-center space-x-3 rounded-xl border-2 px-3.5 py-1.5 shadow-md transition-all duration-300 hover:shadow-lg relative overflow-hidden",
              currentRoleConfig?.bgColor,
              currentRoleConfig?.textColor
            )}
          >
            <IconComponent className="h-5 w-5" />
            <span className="font-semibold">
              {currentRoleConfig?.label || role}
            </span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 p-0 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110",
                    isLoading || isAdmin
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:text-blue-200"
                  )}
                  size="icon"
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
              <TooltipContent className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-xl">
                <p className="font-medium">
                  {isAdmin
                    ? "🔒 Tidak bisa mengubah role Admin"
                    : "✏️ Ubah Role"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}
