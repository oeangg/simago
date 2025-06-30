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
  FileText,
  Calendar,
  Building2,
  Receipt,
  Package,
  AlertCircle,
  TrendingUp,
  Info,
} from "lucide-react";
import { StockType } from "@prisma/client";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface MaterialItems {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  stockType: StockType;
  totalPrice: number;
  notes?: string | null;
}

export interface MaterialInColumnsProps {
  id: string;
  transactionNo: string;
  supplierId: string;
  supplierName: string;
  transactionDate: Date;
  invoiceNo?: string | null;
  totalAmountBeforeTax: number;
  totalTax?: number | null;
  otherCosts?: number | null;
  totalAmount: number;
  notes?: string | null;
  items: MaterialItems[];
}

interface ColumnActions {
  onView: (materialIn: MaterialInColumnsProps) => void;
  onEdit: (materialIn: MaterialInColumnsProps) => void;
  onDelete: (materialIn: MaterialInColumnsProps) => void;
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

// Helper function to format date
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd MMM yyyy", { locale: localeId });
};

// Helper to get stock type badge

export const MaterialInColumns = (
  actions: ColumnActions
): ColumnDef<MaterialInColumnsProps>[] => [
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
    accessorKey: "transactionNo",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="No. Transaksi" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm font-medium">
          {row.getValue("transactionNo")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "transactionDate",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Tanggal" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {formatDate(row.getValue("transactionDate"))}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Supplier" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.getValue("supplierName")}
          </span>
          {row.original.invoiceNo && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              {row.original.invoiceNo}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items;
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {items.length} Material
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Total: {totalItems} pcs
                  </span>
                </div>
                <div className="text-xs flex gap-2 font-thin justify-start items-center">
                  items
                  <Info
                    color="green"
                    className="h-4 w-4 text-muted-foreground"
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                {items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-xs">
                    • Qty: {item.quantity} @ {formatCurrency(item.unitPrice)}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    ...dan {items.length - 3} item lainnya
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.original;
      const hasTax = amount.totalTax && amount.totalTax > 0;
      const hasOtherCosts = amount.otherCosts && amount.otherCosts > 0;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-end cursor-pointer">
                <span className="font-semibold text-sm text-primary">
                  {formatCurrency(row.getValue("totalAmount"))}
                </span>
                {(hasTax || hasOtherCosts) && (
                  <div className="flex items-center gap-1">
                    {hasTax && (
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Tax
                      </Badge>
                    )}
                    {hasOtherCosts && (
                      <Badge variant="outline" className="text-xs">
                        +Biaya
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div>
                  Subtotal: {formatCurrency(amount.totalAmountBeforeTax)}
                </div>
                {hasTax && <div>Pajak: {formatCurrency(amount.totalTax)}</div>}
                {hasOtherCosts && (
                  <div>Biaya Lain: {formatCurrency(amount.otherCosts)}</div>
                )}
                <div className="border-t pt-1 font-semibold">
                  Total: {formatCurrency(amount.totalAmount)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "notes",
    header: "Catatan",
    cell: ({ row }) => {
      const notes = row.original.notes;
      if (!notes)
        return <span className="text-muted-foreground text-xs">-</span>;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {notes}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{notes}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const materialIn = row.original;

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
            <DropdownMenuItem onClick={() => actions.onView(materialIn)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(materialIn)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(materialIn)}
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
