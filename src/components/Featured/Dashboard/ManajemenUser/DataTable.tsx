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
} from "@tanstack/react-table";
import React from "react";
import { FilterInputManUser } from "./FilterInput";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { DataPagination } from "../DataPagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
}

export function DataTableManUser<TData, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters },
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Daftar User</h2>
      <div className="flex gap-4">
        <FilterInputManUser
          placeholder="Cari berdasarkan email..."
          column={table.getColumn("email")}
        />
      </div>

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
                    className="hover:bg-muted/50 transition-colors"
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
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-muted-foreground">
                        Tidak ada data user yang sesuai dengan pencarian{" "}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
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
