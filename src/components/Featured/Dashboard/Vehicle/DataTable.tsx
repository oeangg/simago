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
import { VehicleColumnsProps } from "./Columns";
import { getVehicleFromRow, searchVehicle } from "./DataTableUtils";
import { cn } from "@/lib/cn";
import { DataPagination } from "../DataPagination";

interface DataTableProps<TData extends VehicleColumnsProps, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}

export function VehicleDataTable<TData extends VehicleColumnsProps, TValue>({
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
        const vehicle = getVehicleFromRow(row);
        return searchVehicle(vehicle, value);
      } catch (error) {
        console.error("Global filter error:", error);
        return false;
      }
    },
  });

  // Export selected rows using utility
  const exportSelectedRows = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const vehicles = selectedRows
      .map((row) => {
        try {
          return getVehicleFromRow(row);
        } catch (error) {
          console.error("Error getting vehicle from row:", error);
          return null;
        }
      })
      .filter((vehicles): vehicles is VehicleColumnsProps => vehicles !== null);

    if (vehicles.length > 0) {
      const csvData = vehicles.map((dt) => ({
        "Nomor Kendaraan": dt.vehicleNumber,
        "Type Kendaraan": dt.vehicleType,
        Pembuat: dt.vehicleMake,
        "Tahun Pembuatan": dt.vehicleYear,
      }));

      exportToCSV(csvData, "data-kendaraan");
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
            placeholder="Cari data kendaraan berdasarkan nomor, type, merk dan tahun pembuatan..."
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
                      case "vehicleNumber":
                        return "Nomor Kendaraan";
                      case "vehicleType":
                        return "Type Kendaraan";
                      case "vehicleMake":
                        return "Pembuat";
                      case "vehicleYear":
                        return "Tahun Pembuatan";
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
            <Link href="/dashboard/kendaraan/add">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kendaraan
            </Link>
          </Button>
        </div>
      </div>

      {/* Selected info */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedCount} kendaraan dipilih
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
                      ? "Tidak ada kendaraan yang sesuai dengan pencarian"
                      : "Belum ada data kendaran"}
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
