"use client";

import { ColumnDef, RowData } from "@tanstack/react-table";
import {
  Ellipsis,
  Loader2,
  Pencil,
  Trash2,
  User,
  Phone,
  Hash,
  Filter,
  CheckCircle,
  XCircle,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

import { Gender } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onDeleteEmployee?: (id: string) => void;
    deletingId?: string | null;
  }
}

export interface IEmployeeColumnProps {
  id: string;
  isActive: boolean;
  nik: string;
  name: string;
  gender: Gender;
  phoneNumber: string;
  employment: {
    position: string;
  };
}

const GenderOpt = [
  { value: "MALE", label: "Pria", icon: "👨" },
  { value: "FEMALE", label: "Wanita", icon: "👩" },
] as const;

const SkeletonCell = ({ width = "w-24" }: { width?: string }) => (
  <div className="flex items-center space-x-2">
    <Skeleton className={`h-4 ${width} rounded-md`} />
  </div>
);

export const baseColumns: ColumnDef<IEmployeeColumnProps>[] = [
  {
    accessorKey: "rowIndex",
    header: () => (
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <Hash className="h-4 w-4" />
        <span>No.</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const filteredRows = table.getFilteredRowModel().rows;
      const currentRowIndex = filteredRows.findIndex(
        (filteredRows) => filteredRows.id === row.id
      );
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
          {currentRowIndex + 1}
        </div>
      );
    },
  },
  {
    accessorKey: "nik",
    header: () => (
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <Hash className="h-4 w-4" />
        <span>NIK</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <SkeletonCell width="w-32" />;
      }
      return (
        <div className="font-mono text-sm bg-gray-50 px-3 py-1 rounded-md border">
          {row.original.nik}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: () => (
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <User className="h-4 w-4" />
        <span>Nama</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <SkeletonCell width="w-36" />;
      }
      return (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg  rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900">{row.original.name}</span>
        </div>
      );
    },
  },

  {
    accessorKey: "employment.position",
    header: () => (
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <Briefcase className="h-4 w-4" />
        <span>Jabatan</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <SkeletonCell width="w-32" />;
      }
      return (
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md flex items-center justify-center">
            <Briefcase className="h-3 w-3 text-white" />
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 px-3 py-1 font-medium"
          >
            {row.original.employment?.position || "Tidak Ada Jabatan"}
          </Badge>
        </div>
      );
    },
  },

  {
    accessorKey: "gender",
    header: ({ table, column }) => {
      const filterValue = table.getColumn("gender")?.getFilterValue() as
        | string
        | undefined;

      const handleFilterChange = (value: string) => {
        if (value === "All") {
          table.getColumn(column.id)?.setFilterValue(undefined);
        } else {
          table.getColumn(column.id)?.setFilterValue(value);
        }
      };

      return (
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={filterValue === undefined ? "All" : filterValue}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[160px] h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Filter Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="font-medium">
                <div className="flex items-center space-x-2">
                  <span>🔄</span>
                  <span>Semua Gender</span>
                </div>
              </SelectItem>
              {GenderOpt.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center space-x-2">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    },

    filterFn: (row, id, value) => {
      if (!value) return true; // Show all if no filter
      return row.getValue(id) === value;
    },

    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <SkeletonCell width="w-20" />;
      }
      const genderOption = GenderOpt.find(
        (opt) => opt.value === row.original.gender
      );
      return (
        <Badge
          variant="secondary"
          className={cn(
            "flex items-center space-x-1 w-[185px] px-3 py-1",
            row.original.gender === "MALE"
              ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-300"
              : "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200"
          )}
        >
          <span>{genderOption?.icon}</span>
          <span>{genderOption?.label}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: () => (
      <div className="flex items-center space-x-2 font-semibold text-gray-700">
        <Phone className="h-4 w-4" />
        <span>No. Telepon</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.id.startsWith("skeleton-")) {
        return <SkeletonCell width="w-28" />;
      }
      return (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-sm">{row.original.phoneNumber}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ table, column }) => {
      const filterValue = table.getColumn("isActive")?.getFilterValue() as
        | string
        | undefined;

      const handleFilterChange = (value: string) => {
        if (value === "All") {
          table.getColumn(column.id)?.setFilterValue(undefined);
        } else {
          table.getColumn(column.id)?.setFilterValue(value === "true");
        }
      };

      return (
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />

          <Select
            value={filterValue === undefined ? "All" : String(filterValue)}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[160px] border-2 border-slate-200 hover:border-blue-400 transition-colors duration-300 rounded-xl">
              <SelectValue placeholder="🔄 Status Aktif" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 shadow-xl">
              <SelectItem
                value="All"
                className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
              >
                📊 Semua Status
              </SelectItem>
              <SelectItem
                value="true"
                className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50"
              >
                ✅ Aktif
              </SelectItem>
              <SelectItem
                value="false"
                className="rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50"
              >
                ❌ Tidak Aktif
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    },

    filterFn: (row, id, value) => {
      if (value === undefined) return true;
      return row.getValue(id) === value;
    },
    cell: ({ row }) => {
      const status = row.original.isActive;
      if (row.original.id.startsWith("skeleton-")) {
        return <SkeletonCell width="w-20" />;
      }
      return (
        <Badge
          variant={status ? "default" : "destructive"}
          className={cn(
            "flex items-center w-[190px] space-x-1 px-3 py-1 font-medium",
            status
              ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
              : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
          )}
        >
          {status ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{status ? "Aktif" : "Tidak Aktif"}</span>
        </Badge>
      );
    },
  },
];

export const actionColumn: ColumnDef<IEmployeeColumnProps> = {
  id: "actions",
  header: () => (
    <div className="flex justify-center">
      <span className="font-semibold text-gray-700">Aksi</span>
    </div>
  ),
  cell: ({ row, table }) => {
    const onDeleteEmployee = table.options.meta?.onDeleteEmployee;
    const deletingId = table.options.meta?.deletingId;

    return (
      <div className="flex justify-center">
        <ActionCell
          rowId={row.original.id}
          deletingId={deletingId}
          onDeleteEmployee={onDeleteEmployee}
          employee={row.original}
        />
      </div>
    );
  },
};

const ActionCell = ({
  rowId,
  employee,
  onDeleteEmployee,
  deletingId,
}: {
  rowId: string;
  employee: IEmployeeColumnProps;
  onDeleteEmployee?: (id: string) => void;
  deletingId?: string | null;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const prevDeletingIdRef = useRef<string | undefined>(null);

  useEffect(() => {
    if (
      prevDeletingIdRef.current === employee.id &&
      deletingId === null &&
      isDropDownOpen
    ) {
      setIsDropDownOpen(false);
    }
    prevDeletingIdRef.current = deletingId;
  }, [deletingId, employee.id, isDropDownOpen]);

  if (employee.id.startsWith("skeleton-")) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu open={isDropDownOpen} onOpenChange={setIsDropDownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel className="font-semibold text-gray-700">
            {/* Aksi untuk [{employee.name}] */}
            Aksi
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer  hover:bg-blue-50 focus:bg-blue-50">
              <Link
                href={`/dashboard/karyawan/edit/${rowId}`}
                className="flex items-center px-4 space-x-2 w-full"
              >
                <Pencil className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-blue-600 text-xs font-medium">
                  Edit Data
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-red-50  focus:bg-red-50"
              disabled={deletingId === employee.id}
              onClick={(e) => {
                e.preventDefault();
                setIsDeleteDialogOpen(true);
              }}
            >
              <div className="flex items-center px-4 space-x-2 w-full">
                {deletingId === employee.id ? (
                  <Loader2 className="h-3.5 w-3.5 text-red-600 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                )}
                <span className="text-red-600 text-xs font-medium">
                  {deletingId === employee.id ? "Menghapus..." : "Hapus Data"}
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setIsDropDownOpen(false);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Konfirmasi Penghapusan</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus data karyawan{" "}
              <span className="font-semibold text-gray-900">
                {employee.name}
              </span>
              ?
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                ⚠️ Tindakan ini tidak dapat dibatalkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-100">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteEmployee?.(employee.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
