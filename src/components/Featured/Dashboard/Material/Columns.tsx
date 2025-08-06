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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Tag,
  Scale,
  Trash,
  Wrench,
  Box,
  Bolt,
} from "lucide-react";
import { Brand, MaterialCategory, Unit } from "@prisma/client";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";
import { cn } from "@/lib/cn";
import React from "react";

export interface MaterialColumnsProps {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  category: MaterialCategory;
  unit: Unit;
  brand: Brand;
  minimumStock: number;
  maximumStock?: number | null;
  goodStock: number;
  badStock: number;
  lastPurchasePrice?: number | null;
}

interface ColumnActions {
  onView: (material: MaterialColumnsProps) => void;
  onEdit: (material: MaterialColumnsProps) => void;
  onDelete: (material: MaterialColumnsProps) => void;
}

// Helper function to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (!value) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format number
const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
};

// get stock status
const getStockStatus = (current: number, min: number, max?: number | null) => {
  if (current <= min) {
    return { status: "critical", label: "Stok Kritis", color: "destructive" };
  }
  if (current <= min * 1.5) {
    return { status: "low", label: "Stok Rendah", color: "warning" };
  }
  if (max && current >= max * 0.9) {
    return { status: "high", label: "Stok Tinggi", color: "secondary" };
  }
  return { status: "normal", label: "Stok Normal", color: "success" };
};

type CategoryConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
};
const CATEGORY_CONFIG = {
  RAW_MATERIAL: {
    label: "Bahan Baku",
    icon: Package,
    color: "bg-blue-100 text-blue-800",
  },
  CONSUMABLES: {
    label: "Habis Pakai",
    icon: Trash,
    color: "bg-orange-100 text-orange-800",
  },
  SPARE_PARTS: {
    label: "Suku Cadang",
    icon: Wrench,
    color: "bg-purple-100 text-purple-800",
  },
  PACKAGING: {
    label: "Kemasan",
    icon: Box,
    color: "bg-teal-100 text-teal-800",
  },
  TOOLS: {
    label: "Perkakas",
    icon: Bolt,
    color: "bg-amber-100 text-amber-800",
  },
} as const satisfies Record<MaterialCategory, CategoryConfig>;
// get category display
const getCategoryDisplay = (category: MaterialCategory) => {
  return (
    CATEGORY_CONFIG[category] || {
      label: category,
      icon: Box,
      color: "bg-gray-100 text-gray-800",
    }
  );
};

export const MaterialColumns = (
  actions: ColumnActions
): ColumnDef<MaterialColumnsProps>[] => [
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
      return (
        <DataTableColumnHeaderSort column={column} title="Kode Material" />
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm font-medium">
          {row.getValue("code")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Nama Material" />
      );
    },
    cell: ({ row }) => {
      const material = row.original;
      return (
        <div className="flex flex-col gap-1 min-w-[200px]">
          <span className="font-medium line-clamp-1">{material.name}</span>
          {material.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground line-clamp-1 cursor-help">
                    {material.description}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>{material.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Kategori" />;
    },
    cell: ({ row }) => {
      const category = row.getValue("category") as MaterialCategory;
      const { label, icon: Icon, color } = getCategoryDisplay(category);

      return (
        <div
          className={cn(
            "gap-1.5 flex px-3 py-1 rounded-md  font-medium text-xs  items-center",
            color
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "brand.name",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Merek" />;
    },
    cell: ({ row }) => {
      const brand = row.original.brand;
      return (
        <div className="flex items-center gap-2">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{brand}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "unit",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Satuan" />;
    },
    cell: ({ row }) => {
      const unit = row.getValue("unit") as Unit;
      return (
        <div className="flex items-center gap-2">
          <Scale className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className="text-xs font-medium">
            {unit}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "currentStock",
    header: "Stok Saat Ini",
    cell: ({ row }) => {
      const material = row.original;
      const stockStatus = getStockStatus(
        material.goodStock,
        material.minimumStock,
        material.maximumStock
      );

      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2">
              {stockStatus.status === "critical" && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {stockStatus.status === "low" && (
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              )}
              {stockStatus.status === "high" && (
                <TrendingUp className="h-4 w-4 text-blue-500" />
              )}
              <span
                className={cn(
                  "font-medium",
                  stockStatus.status === "critical" && "text-red-600",
                  stockStatus.status === "low" && "text-yellow-600"
                )}
              >
                {formatNumber(material.goodStock)} {material.unit}
              </span>
            </div>
            <Badge
              variant={
                stockStatus.color as
                  | "default"
                  | "secondary"
                  | "destructive"
                  | "outline"
              }
              className="text-xs"
            >
              {stockStatus.label}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    id: "stockInfo",
    header: "Info Stok",
    cell: ({ row }) => {
      const material = row.original;

      return (
        <div className="flex flex-col gap-1 ">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Min :</span>
            <span className="font-medium">
              {formatNumber(material.minimumStock)} {material.unit}
            </span>
          </div>

          {material.maximumStock && (
            <div className="flex items-center gap-1 text-xs">
              <span>Max :</span>
              <span>
                {formatNumber(material.maximumStock)} {material.unit}
              </span>
            </div>
          )}

          {material.goodStock !== null && material.goodStock !== undefined && (
            <div className="flex items-center text-green-600 font-semibold gap-1 text-sm">
              <span>Baik :</span>
              <span>
                {formatNumber(material.goodStock)} {material.unit}
              </span>
            </div>
          )}

          {material.badStock !== null && material.badStock !== undefined && (
            <div className="flex items-center text-red-600 gap-1 text-xs">
              <span>Rusak :</span>
              <span>
                {formatNumber(material.badStock)} {material.unit}
              </span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lastPurchasePrice",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Harga Terakhir" />
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("lastPurchasePrice") as number | null;

      return (
        <div className="text-right font-medium">{formatCurrency(price)}</div>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const material = row.original;

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
            <DropdownMenuItem onClick={() => actions.onView(material)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(material)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(material)}
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
