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
import { EmployeeColumns } from "./Columns";
import { getEmployeeFromRow, searchEmployee } from "./DataTableUtils";
import { exportToCSV } from "@/tools/exportToCSV";
import { formatDate } from "@/tools/formatDateLocal";
import { Gender } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { DataPagination } from "../DataPagination";

interface DataTableProps<TData extends EmployeeColumns, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}

export function EmployeeDataTable<TData extends EmployeeColumns, TValue>({
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
  const [isExploring, setIsExporting] = React.useState(false);

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
        pageSize: 10, // Increased default page size
      },
    },
    // Global filter function using utility
    globalFilterFn: (row, columnId, value) => {
      try {
        const employee = getEmployeeFromRow(row);
        return searchEmployee(employee, value);
      } catch (error) {
        console.error("Global filter error:", error);
        return false;
      }
    },
  });

  // Export selected rows using utility
  const exportSelectedRows = () => {
    try {
      setIsExporting(true);
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const employees = selectedRows
        .map((row) => {
          try {
            return getEmployeeFromRow(row);
          } catch (error) {
            console.error("Error getting employee from row:", error);
            return null;
          }
        })
        .filter((employee): employee is EmployeeColumns => employee !== null);

      if (employees.length === 0) {
        console.warn("No employees selected for export");
        return;
      }

      // Perbaikan: Map setiap vendor dengan index yang sesuai
      const csvData = employees.map((em) => {
        // Ambil data berdasarkan vendor yang sedang diproses
        const lastEmployment = em.employments[0];
        // Helper function untuk format alamat

        return {
          NIK: em.nik || "-",
          "Nama Karyawan": em.name || "-",
          Kelamin: (em.gender as Gender) === "MALE" ? "Pria" : "Wanita",
          Alamat: em.address || "-",
          Kota: em.city || "-",
          "Phone Number": em.phoneNumber || "-",
          Divisi: lastEmployment.division.name,
          Jabatan: lastEmployment.position.name,
          Status: em.isActive ? "Aktif" : "Non-Aktif",
          "Tgl Masuk": formatDate(em.activeDate),
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
            isLoading && "opacity-50 pointer-events-none"
          )}
        >
          <Input
            placeholder="Cari data karyawan ..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            isLoading && "opacity-50 pointer-events-none"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Kolom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle kolom</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  // Get proper column titles
                  const getColumnTitle = (id: string) => {
                    switch (id) {
                      case "nik":
                        return "NIK";
                      case "name":
                        return "Nama Karyawan";
                      case "gender":
                        return "Jenis Kelamin";
                      case "division":
                        return "Divisi";
                      case "city":
                        return "Alamat Kota";
                      case "phone":
                        return "No Handphone";
                      case "isActive":
                        return "Status Aktif";
                      case "activeDate":
                        return "Tgl Bergabung";
                      case "actions":
                        return "Aksi";
                      default:
                        return id;
                    }
                  };

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {getColumnTitle(column.id)}
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
              disabled={isExploring}
            >
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedCount})
            </Button>
          )}

          {/* Add Employee */}
          <Button
            asChild
            className={cn(
              " transition-opacity duration-200",
              isLoading && "opacity-50 pointer-events-none"
            )}
          >
            <Link href="/dashboard/karyawan/add">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Karyawan
            </Link>
          </Button>
        </div>
      </div>

      {/* Selected info */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedCount} karyawan dipilih
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
                      <TableHead key={header.id} className="whitespace-nowrap">
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
                      <TableCell key={cell.id} className="py-3">
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
                      ? "Tidak ada karyawan yang sesuai dengan pencarian"
                      : "Belum ada data karyawan"}
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
          " transition-opacity duration-200",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        <DataPagination table={table} />
      </div>
    </div>
  );
}
