"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  getFilteredRowModel,
  flexRender,
  getCoreRowModel,
  SortingState,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import React from "react";
import { Plus, X, Package, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { MaterialInColumnsProps } from "./Columns";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { DateRangePicker } from "./DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { getMaterialInFromRow } from "./DataTableUtils";
import { exportToCSV } from "@/tools/exportToCSV";
import { toast } from "sonner";
import { formatDate } from "@/tools/formatDateLocal";
import { DataPagination } from "../DataPagination";

interface DataTableProps {
  columns: ColumnDef<MaterialInColumnsProps>[];
  data: MaterialInColumnsProps[];
  onSearchChange?: (search: string) => void;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  isLoading?: boolean; // Add back
  searchValue?: string;
  dateRangeValue?: DateRange;
}

export function MaterialInDataTable({
  columns,
  data,
  dateRangeValue,
  onDateRangeChange,
  onSearchChange,
  searchValue = "",
  isLoading = false,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isExploring, setIsExporting] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Quick date range handler
  const handleQuickDateRange = (preset: string) => {
    if (!onDateRangeChange) return;

    const today = new Date();
    let from: Date;
    let to: Date;

    // Fungsi helper untuk mengatur waktu ke awal hari
    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // Fungsi helper untuk mengatur waktu ke akhir hari
    const endOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    switch (preset) {
      case "today":
        from = startOfDay(today);
        to = endOfDay(today); // Pastikan 'to' juga mencakup akhir hari ini
        break;
      case "last7days":
        from = startOfDay(addDays(today, -7)); // Mulai dari awal hari 7 hari yang lalu
        to = endOfDay(today); // Sampai akhir hari ini
        break;
      case "thisMonth":
        from = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)); // Mulai dari awal bulan
        to = endOfDay(today); // Sampai akhir hari ini
        break;
      default:
        return;
    }

    onDateRangeChange({ from, to });
  };

  // Export selected rows using utility

  const exportSelectedRows = () => {
    try {
      setIsExporting(true);
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const materialins = selectedRows
        .map((row) => {
          try {
            return getMaterialInFromRow(row);
          } catch (error) {
            console.error("Error getting materialIns from row:", error);
            return null;
          }
        })
        .filter(
          (materialin): materialin is MaterialInColumnsProps =>
            materialin !== null
        );

      if (materialins.length === 0) {
        console.warn("No materialin selected for export");
        return;
      }

      // Perbaikan: Map setiap vendor dengan index yang sesuai
      const csvData = materialins.map((dt) => {
        // Ambil data berdasarkan vendor yang sedang diproses
        // Helper function untuk format alamat

        return {
          "No Transaksi": dt.transactionNo,
          "Tgl Transaksi": formatDate(dt.transactionDate),
          Supplier: dt.supplierName,
          "Jumlah Items": dt.items.length.toString(),
          "Total Amount": dt.totalAmount,
        };
      });

      if (csvData.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      exportToCSV(csvData, "data-pembelian-material");
      toast.success(`${csvData.length} pembelian material berhasil dieksport`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    onSearchChange?.("");
    onDateRangeChange?.(undefined);
  };

  const hasActiveFilters = searchValue || dateRangeValue;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="space-y-4">
        {/* First Row: Search, Date Range, Quick Filters, Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 w-full sm:w-auto">
            <Input
              placeholder="Cari data pembelian berdasarkan no transaksi, supplier, invoice..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              disabled={isLoading}
              className="h-9 w-full max-w-xl"
            />
          </div>

          {/* Date Range Picker */}
          <div className={cn(isLoading && "pointer-events-none opacity-60")}>
            <DateRangePicker
              dateRange={dateRangeValue}
              onDateRangeChange={(range) => onDateRangeChange?.(range)}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange("today")}
              disabled={isLoading}
            >
              Hari Ini
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange("last7days")}
              disabled={isLoading}
            >
              7 Hari
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange("thisMonth")}
              disabled={isLoading}
            >
              Bulan Ini
            </Button>
          </div>

          {/* Add Button */}
          <Button
            asChild
            size="sm"
            className={cn(
              "transition-opacity duration-200",
              isLoading && "opacity-50 pointer-events-none"
            )}
          >
            <Link href="/dashboard/pembelian-material/add">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pembelian
            </Link>
          </Button>
        </div>

        {/* Second Row: Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Filter aktif:</span>
              {searchValue && (
                <Badge variant="secondary">Pencarian: {searchValue}</Badge>
              )}
              {dateRangeValue && (
                <Badge variant="secondary">
                  Periode: {format(dateRangeValue.from!, "dd/MM/yyyy")}
                  {dateRangeValue.to &&
                    ` - ${format(dateRangeValue.to, "dd/MM/yyyy")}`}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filter
            </Button>
          </div>
        )}
      </div>

      {/* Selected info & convertCSV */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} pembelian dipilih
          </span>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              className="disabled:opacity-60"
              onClick={exportSelectedRows}
              disabled={isExploring}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to CSV ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
            >
              Batal Pilih
            </Button>
          </div>
        </div>
      )}

      {/* Table */}

      <div className="relative">
        {/* loading  */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex border items-center justify-center rounded-md">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-md" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Memuat data...
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            "rounded-md border overflow-x-auto transition-opacity duration-200",
            isLoading && "opacity-50"
          )}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8" />
                      <p className="text-sm">
                        {hasActiveFilters
                          ? "Tidak ada pembelian material yang sesuai dengan filter"
                          : "Belum ada data pembelian material"}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleClearFilters}
                        >
                          Clear filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div
        className={cn(
          "transition-opacity duration-200",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        <DataPagination table={table} />
      </div>
    </div>
  );
}
