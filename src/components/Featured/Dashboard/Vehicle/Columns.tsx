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
  Car,
  Calendar,
  Hash,
} from "lucide-react";
import { VehicleType } from "@prisma/client";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";

export interface VehicleColumnsProps {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleMake?: string;
  vehicleYear?: string;
}

interface ColumnActions {
  onView: (vehicle: VehicleColumnsProps) => void;
  onEdit: (vehicle: VehicleColumnsProps) => void;
  onDelete: (vehicle: VehicleColumnsProps) => void;
}

const vehicleTypeOptions = [
  { value: "BOX", label: "Box", color: "bg-blue-100 text-blue-800" },
  { value: "TRUCK", label: "Truck", color: "bg-green-100 text-green-800" },
  {
    value: "WINGBOX",
    label: "Wing Box",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "TRONTON",
    label: "Tronton",
    color: "bg-orange-100 text-orange-800",
  },
  { value: "TRAILER", label: "Trailer", color: "bg-red-100 text-red-800" },
  { value: "PICKUP", label: "Pickup", color: "bg-yellow-100 text-yellow-800" },
  { value: "VAN", label: "Van", color: "bg-indigo-100 text-indigo-800" },
];

// Helper function untuk mendapatkan label dan warna vehicle type
const getVehicleTypeConfig = (type: VehicleType) => {
  const config = vehicleTypeOptions.find((option) => option.value === type);
  if (!config) {
    return <Badge variant="outline">{type}</Badge>;
  }

  return (
    <Badge className={`${config.color} border-0 px-2 py-1.5`}>
      {config.label}
    </Badge>
  );
};

export const VehicleColumns = (
  actions: ColumnActions
): ColumnDef<VehicleColumnsProps>[] => [
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
    accessorKey: "vehicleNumber",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Nomor Kendaraan" />
      );
    },
    cell: ({ row }) => {
      const vehicleNumber = row.getValue("vehicleNumber") as string;

      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <Hash className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="font-mono font-semibold text-sm">
            {vehicleNumber}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "vehicleType",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Tipe Kendaraan" />
      );
    },
    cell: ({ row }) => {
      const vehicleType = row.getValue("vehicleType") as VehicleType;
      return (
        <div className="min-w-[100px]">{getVehicleTypeConfig(vehicleType)}</div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "vehicleMake",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Merek" />;
    },
    cell: ({ row }) => {
      const vehicleMake = row.getValue("vehicleMake") as string;

      if (!vehicleMake) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{vehicleMake}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "vehicleYear",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Tahun" />;
    },
    cell: ({ row }) => {
      const vehicleYear = row.getValue("vehicleYear") as string;

      if (!vehicleYear) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div className="flex items-center gap-2 min-w-[80px]">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium">{vehicleYear}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const vehicle = row.original;

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
            <DropdownMenuItem onClick={() => actions.onView(vehicle)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(vehicle)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(vehicle)}
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
