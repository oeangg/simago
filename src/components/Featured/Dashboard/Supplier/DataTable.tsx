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

import { Plus, Download, Settings2 } from "lucide-react";
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
import { SupplierColumnsProps } from "./Columns";
import { getSupplierFromRow, searchSupplier } from "./DataTableUtils";
import { SupplierDataPagination } from "./Pagination";
import { exportToCSV } from "@/tools/exportToCSV";
import { formatDate } from "@/tools/formatDateLocal";
import { toast } from "sonner";

interface DataTableProps<TData extends SupplierColumnsProps, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function SupplierDataTable<TData extends SupplierColumnsProps, TValue>({
  columns,
  data,
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
        const supplier = getSupplierFromRow(row);
        return searchSupplier(supplier, value);
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
      const suppliers = selectedRows
        .map((row) => {
          try {
            return getSupplierFromRow(row);
          } catch (error) {
            console.error("Error getting supplier from row:", error);
            return null;
          }
        })
        .filter(
          (supplier): supplier is SupplierColumnsProps => supplier !== null
        );

      if (suppliers.length === 0) {
        console.warn("No suppliers selected for export");
        return;
      }

      // Perbaikan: Map setiap vendor dengan index yang sesuai
      const csvData = suppliers.map((supplier) => {
        // Ambil data berdasarkan vendor yang sedang diproses
        const primaryAddress = supplier.addresses.find(
          (ad) => ad.isPrimaryAddress
        );
        const primaryContact = supplier.contacts.find(
          (contact) => contact.isPrimaryContact
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

        return {
          Code: supplier.code || "-",
          "Nama Vendor": supplier.name || "-",
          Negara: primaryAddress?.country?.name || "-",
          "Alamat Utama": formatAddress(primaryAddress),
          "Kontak Utama": formatContact(primaryContact),
          Status: supplier.statusActive ? "Aktif" : "Non-Aktif",
          "Tanggal Terdaftar": supplier.activeDate
            ? formatDate(supplier.activeDate)
            : "-",
        };
      });

      if (csvData.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      exportToCSV(csvData, "data-suppliers");
      toast.success(`${csvData.length} supplier berhasil dieksport`);
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
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Cari supplier (nama, kode, NPWP, kontak, alamat)..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
                      {column.id === "supplierType" && "Tipe"}
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
          <Button asChild>
            <Link href="/dashboard/supplier/add">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Selected info */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedCount} suppplier dipilih
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
      <div className="rounded-md border  overflow-x-auto  ">
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
                    ? "Tidak ada supplier yang sesuai dengan pencarian"
                    : "Belum ada data supplier"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <SupplierDataPagination table={table} />
    </div>
  );
}
