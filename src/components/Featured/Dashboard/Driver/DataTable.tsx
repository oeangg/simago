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
import { DriverColumnsProps } from "./Columns";
import { getDriverFromRow, searchDriver } from "./DataTableUtils";
import { formatDate } from "@/tools/formatDateLocal";
import { cn } from "@/lib/cn";
import { DataPagination } from "../DataPagination";

interface DataTableProps<TData extends DriverColumnsProps, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}

export function DriverDataTable<TData extends DriverColumnsProps, TValue>({
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
        const driver = getDriverFromRow(row);
        return searchDriver(driver, value);
      } catch (error) {
        console.error("Global filter error:", error);
        return false;
      }
    },
  });

  // Export selected rows using utility
  const exportSelectedRows = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const drivers = selectedRows
      .map((row) => {
        try {
          return getDriverFromRow(row);
        } catch (error) {
          console.error("Error getting employee from row:", error);
          return null;
        }
      })
      .filter((driver): driver is DriverColumnsProps => driver !== null);

    if (drivers.length > 0) {
      const csvData = drivers.map((dt) => ({
        Code: dt.code,
        Nama: dt.name,
        "Alamat ": `${dt.addressLine1} ,${dt.addressLine2}`,
        Kota: dt.city,
        Gender: dt.gender === "MALE" ? "Laki-laki" : "Perempuan",
        "No. Telepon": dt.phoneNumber,
        Status: dt.statusActive ? "Aktif" : "Non-Aktif",
        "Tanggal Aktif": formatDate(dt.activeDate),
      }));

      exportToCSV(csvData, "data-driver");
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
            placeholder="Cari data driver ..."
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
                      case "code":
                        return "Code";
                      case "name":
                        return "Nama Karyawan";
                      case "gender":
                        return "Gender";
                      case "city":
                        return "Alamat Kota";
                      case "phone":
                        return "No Handphone";
                      case "statusActive":
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
            <Button variant="outline" size="sm" onClick={exportSelectedRows}>
              <Download className="mr-2 h-4 w-4" />
              Export ({selectedCount})
            </Button>
          )}

          {/* Add Employee */}
          <Button
            asChild
            className={cn(
              "transition-opacity duration-200",
              isLoading && "opacity-50 pointer-events-none"
            )}
          >
            <Link href="/dashboard/driver/add">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Driver
            </Link>
          </Button>
        </div>
      </div>

      {/* Selected info */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedCount} driver dipilih
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
                      ? "Tidak ada driver yang sesuai dengan pencarian"
                      : "Belum ada data driver"}
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
