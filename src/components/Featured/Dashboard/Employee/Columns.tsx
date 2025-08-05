"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  Edit,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Gender } from "@prisma/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";
import { BadgeChartAt } from "@/components/ui/badgeChartAt";
import { getGenderConfig } from "../Driver/Columns";

// Type definition based on your router response
export type EmployeeColumns = {
  id: string;
  nik: string;
  name: string;
  isActive: boolean;
  activeDate: Date | string;
  gender: Gender;
  address: string;
  city: string;
  zipcode: string;
  phoneNumber: string;
  photo?: string | null;
  ttdDigital?: string | null;
  resignDate?: Date | string | null;
  employments: {
    id: string;
    startDate: Date | string;
    endDate?: Date | string | null;
    position: {
      id: string;
      name: string;
    };
    division: {
      id: string;
      name: string;
    };
  }[];
};

interface ColumnActions {
  onView: (employee: EmployeeColumns) => void;
  onEdit: (employee: EmployeeColumns) => void;
  onDelete: (employee: EmployeeColumns) => void;
}

const getStatusBadge = (status: boolean) => {
  const config = {
    variant: status ? ("default" as const) : ("destructive" as const),
    label: status ? "Aktif" : "Tidak Aktif",
    className: status ? "bg-green-500 hover:bg-green-600 text-white" : "",
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      <div
        className={`w-2 h-2 rounded-full mr-2  ${
          status ? "bg-white" : "bg-red-100"
        }`}
      />
      {config.label}
    </Badge>
  );
};

const getDivisionBadgeConfig = (division: string) => {
  const upperDiv = division.toUpperCase();
  switch (upperDiv) {
    case "MARKETING":
      return { variant: "default" as const, color: "bg-blue-500 text-white" };
    case "IT":
      return {
        variant: "secondary" as const,
        color: "bg-purple-500 text-white",
      };
    case "FINANCE":
      return { variant: "outline" as const, color: "bg-green-500 text-white" };
    case "HR":
      return {
        variant: "destructive" as const,
        color: "bg-orange-500 text-white",
      };
    case "OPERATIONS":
      return { variant: "default" as const, color: "bg-indigo-500 text-white" };
    default:
      return { variant: "outline" as const, color: "bg-gray-500 text-white" };
  }
};

export const employeeColumns = (
  actions: ColumnActions
): ColumnDef<EmployeeColumns>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nik",
    header: () => {
      return (
        <div className="font-medium text-muted-foreground">
          <span>N.I.K</span>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-28">
        <div className="font-mono text-sm font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded">
          {row.original.nik}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Nama Karyawan" />
      );
    },
    cell: ({ row }) => {
      const employee = row.original;
      const latestEmployment = employee.employments[0];

      // Format tanggal helper
      const date = row.getValue("activeDate") as string | null;
      if (!date) return <span className="text-muted-foreground">-</span>;

      // Get initials for avatar
      const getInitials = (name: string) => {
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      };

      return (
        <div className="flex items-center gap-3 min-w-[220px]">
          <BadgeChartAt>{getInitials(employee.name)}</BadgeChartAt>

          <div className="flex flex-col">
            <p className="font-semibold text-gray-900">{employee.name}</p>
            {latestEmployment && (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Briefcase className="w-3 h-3" />
                  {latestEmployment.position.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Mulai {format(new Date(date), "dd MMM yyyy", { locale: id })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "gender",
    header: "Jenis Kelamin",
    cell: ({ row }) => {
      const gender = row.original.gender as Gender;
      return getGenderConfig(gender);
    },
  },
  {
    id: "division",
    accessorFn: (row) => row.employments[0]?.division.name || "-",
    header: "Divisi",
    cell: ({ row }) => {
      const employee = row.original;
      const latestEmployment = employee.employments[0];

      if (!latestEmployment) {
        return <span className="text-muted-foreground">-</span>;
      }

      const divisionName = latestEmployment.division.name;
      const config = getDivisionBadgeConfig(divisionName);

      return (
        <Badge variant={config.variant} className={config.color}>
          {divisionName}
        </Badge>
      );
    },
  },
  {
    id: "city",
    header: "Alamat",
    cell: ({ row }) => {
      const city = row.original.city;
      const address = row.original.address;
      const zipcode = row.original.zipcode;

      return (
        <div className="flex flex-col gap-1 max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 line-clamp-1">
              {city}
            </span>
            {zipcode && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {zipcode}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{address}</p>
        </div>
      );
    },
  },
  {
    id: "phone",
    header: "Kontak",
    cell: ({ row }) => {
      const phoneNumber = row.original.phoneNumber;

      return (
        <div className="flex flex-col gap-2 min-w-[160px]">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-mono font-medium">{phoneNumber}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.isActive as boolean;
      return <div className="w-[100px]">{getStatusBadge(status)}</div>;
    },
  },
  {
    id: "activeDate",
    accessorFn: (row) => row.employments[0]?.startDate || null,
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Tgl Bergabung" />
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("activeDate") as string | null;
      if (!date) return <span className="text-muted-foreground">-</span>;

      return (
        <span className="text-sm font-medium text-muted-foreground">
          {format(new Date(date), "dd MMM yyyy", { locale: id })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const employee = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel className="font-semibold">
              Aksi
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onView(employee)}
              className="hover:bg-blue-50 hover:text-blue-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onEdit(employee)}
              className="hover:bg-green-50 hover:text-green-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(employee)}
              className="text-red-600 focus:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
