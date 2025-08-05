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

import { Plus, Download, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { exportToCSV } from "@/tools/exportToCSV";
import { VendorColumnsProps } from "./Columns";
import { getVendorFromRow, searchVendor } from "./DataTableUtils";
import { formatDate } from "@/tools/formatDateLocal";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { DataPagination } from "../DataPagination";

interface DataTableProps<TData extends VendorColumnsProps, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}

export function VendorDataTable<TData extends VendorColumnsProps, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    // Global filter function using utility
    globalFilterFn: (row, columnId, value) => {
      try {
        const vendor = getVendorFromRow(row);
        return searchVendor(vendor, value);
      } catch {
        return false;
      }
    },
  });

  // Export selected rows using utility
  const exportSelectedRows = () => {
    try {
      setIsExporting(true);
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const vendors = selectedRows
        .map((row) => {
          try {
            return getVendorFromRow(row);
          } catch (error) {
            console.error("Error getting vendor from row:", error);
            return null;
          }
        })
        .filter((vendor): vendor is VendorColumnsProps => vendor !== null);

      if (vendors.length === 0) {
        console.warn("No vendors selected for export");
        return;
      }

      // Perbaikan: Map setiap vendor dengan index yang sesuai
      const csvData = vendors.map((vendor) => {
        // Ambil data berdasarkan vendor yang sedang diproses
        const primaryAddress = vendor.vendorAddresses.find(
          (ad) => ad.isPrimaryAddress
        );
        const primaryContact = vendor.vendorContacts.find(
          (contact) => contact.isPrimaryContact
        );
        const primaryBanking = vendor.vendorBankings.find(
          (banking) => banking.isPrimaryBankingNumber
        );

        // Helper function untuk format alamat

        const formatAddress = (address: typeof primaryAddress) => {
          if (!address) return "-";

          const parts = [
            address.addressLine1,
            address.addressLine2,
            address.province?.name,
            address.regency?.name,
            address.district?.name,
          ].filter(Boolean); // Remove empty/null values
          return parts.join(", ");
        };

        // Helper function untuk format kontak
        const formatContact = (contact: typeof primaryContact) => {
          if (!contact) return "-";
          const parts = [
            contact.name,
            contact.phoneNumber,
            contact.email,
          ].filter(Boolean);
          return parts.join(", ");
        };

        // Helper function untuk format banking
        const formatBanking = (banking: typeof primaryBanking) => {
          if (!banking) return "-";
          const parts = [
            banking.bankingBank,
            banking.bankingNumber,
            banking.bankingName,
          ].filter(Boolean);
          return parts.join(", ");
        };

        return {
          Code: vendor.code || "-",
          "Nama Vendor": vendor.name || "-",
          Negara: primaryAddress?.country?.name || "-",
          "Alamat Utama": formatAddress(primaryAddress),
          "Kontak Utama": formatContact(primaryContact),
          "No Rekening": formatBanking(primaryBanking),
          Status: vendor.statusActive ? "Aktif" : "Non-Aktif",
          "Tanggal Terdaftar": vendor.activeDate
            ? formatDate(vendor.activeDate)
            : "-",
        };
      });

      if (csvData.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      exportToCSV(csvData, "data-vendors");
      toast.success(`${csvData.length} vendor berhasil dieksport`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div
          className={cn(
            "flex-1 w-full sm:w-auto transition-opacity duration-200",
            isLoading && "opacity-50 pointer-events-none "
          )}
        >
          <Input
            placeholder="Cari data vendor berdasarkan nama, kode, NPWP, kontak, alamat..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xl"
          />
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            isLoading && "opacity-50 pointer-events-none"
          )}
        >
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Kolom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle kolom</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "code" && "Kode"}
                      {column.id === "name" && "Nama"}
                      {column.id === "vendorType" && "Tipe"}
                      {column.id === "primaryAddress" && "Alamat"}
                      {column.id === "primaryContact" && "Kontak"}
                      {column.id === "npwp" && "NPWP"}
                      {column.id === "statusActive" && "Status"}
                      {column.id === "activeDate" && "TglBergabung"}
                      {column.id === "actions" && "Aksi"}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export selected */}
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className=" disabled:opacity-60"
              onClick={exportSelectedRows}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedCount})
            </Button>
          )}

          {/* Add Supplier */}
          <Button
            asChild
            className={cn(
              "transition-opacity duration-200",
              isLoading && "opacity-50 pointer-events-none"
            )}
          >
            <Link href="/dashboard/vendor/add">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Vendor
            </Link>
          </Button>
        </div>
      </div>

      {/* Selected info */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedCount} vendor dipilih
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Batal Pilih
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="relative">
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
                    {globalFilter || table.getState().columnFilters.length > 0
                      ? "Tidak ada vendor yang sesuai dengan pencarian"
                      : "Belum ada data vendor"}
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
