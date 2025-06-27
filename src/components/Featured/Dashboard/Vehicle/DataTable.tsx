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

import { exportToCSV } from "@/tools/exportToCSV";
import { VehicleColumnsProps } from "./Columns";
import { getVehicleFromRow, searchVehicle } from "./DataTableUtils";
import { VehicleDataPagination } from "./Pagination";

interface DataTableProps<TData extends VehicleColumnsProps, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function VehicleDataTable<TData extends VehicleColumnsProps, TValue>({
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
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Cari nomor type, merk dan tahun pembuatan kendaraan..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
          <Button asChild>
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
      <div className="rounded-md border overflow-x-auto">
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

      {/* Pagination */}
      <VehicleDataPagination table={table} />
    </div>
  );
}
