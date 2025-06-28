"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Phone,
  MapPin,
  User,
  Mars,
  Venus,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Gender } from "@prisma/client";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";

export interface DriverColumnsProps {
  id: string;
  code: string;
  name: string;
  gender: Gender;
  statusActive: boolean;
  activeDate: Date | string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  phoneNumber: string;
}

interface ColumnActions {
  onView: (driver: DriverColumnsProps) => void;
  onEdit: (driver: DriverColumnsProps) => void;
  onDelete: (driver: DriverColumnsProps) => void;
}

// Helper functions
const getStatusBadge = (status: boolean) => {
  const config = {
    variant: status ? ("default" as const) : ("destructive" as const),
    label: status ? "Aktif" : "Tidak Aktif",
    className: status ? "bg-green-500 hover:bg-green-600 text-white" : "",
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          status ? "bg-white" : "bg-red-100"
        }`}
      />
      {config.label}
    </Badge>
  );
};

const getGenderConfig = (gender: Gender) => {
  const clsGender = {
    MALE: {
      icon: <Mars className="w-4 h-4 text-blue-600" />,
      label: "Pria",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      dotColor: "bg-blue-500",
    },
    FEMALE: {
      icon: <Venus className="w-4 h-4 text-pink-600" />,
      label: "Wanita",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-700",
      dotColor: "bg-pink-500",
    },
  };

  const config = clsGender[gender] || clsGender.MALE;

  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border
          ${config.bgColor} ${config.borderColor} ${config.textColor}
          transition-all duration-200 hover:shadow-sm
        `}
      >
        <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    </div>
  );
};

const formatAddress = (
  addressLine1: string,
  addressLine2?: string | null,
  city?: string
) => {
  const parts = [addressLine1, addressLine2, city].filter(Boolean);
  return parts.join(", ");
};

export const driverColumns = (
  actions: ColumnActions
): ColumnDef<DriverColumnsProps>[] => [
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
    accessorKey: "code",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Kode Driver" />;
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue("code")}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Nama Driver" />;
    },
    cell: ({ row }) => {
      const driver = row.original;

      return (
        <div className="flex items-center gap-2 min-w-[180px]">
          <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{driver.name}</span>
            <span className="text-xs font-light text-muted-foreground">
              {row.original.city}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "gender",
    header: "Jenis Kelamin",
    cell: ({ row }) => {
      const gender = row.original.gender as Gender;
      return getGenderConfig(gender);
    },
  },
  {
    id: "address",
    header: "Alamat",
    cell: ({ row }) => {
      const driver = row.original;
      const fullAddress = formatAddress(
        driver.addressLine1,
        driver.addressLine2,
        driver.city
      );

      return (
        <div className="flex items-start gap-2 max-w-[250px]">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm min-w-0">
            <p className="line-clamp-2 leading-relaxed">{fullAddress}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Nomor Telepon",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phoneNumber") as string;
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-mono">{phoneNumber}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "statusActive",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusActive") as boolean;
      return getStatusBadge(status);
    },
  },
  {
    accessorKey: "activeDate",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Tanggal Aktif" />
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("activeDate") as string;
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
      const driver = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => actions.onView(driver)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(driver)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(driver)}
              className="text-red-600 focus:text-red-600"
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
