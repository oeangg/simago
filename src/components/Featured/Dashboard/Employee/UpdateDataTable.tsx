"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Gender } from "@prisma/client";
import { useRouter } from "next/navigation";
import { employeeColumns, EmployeeColumns } from "./Columns";
import ViewEmployee from "./EmployeeView";
import { EmployeeDataTable } from "./DataTable";

// Skeleton component untuk loading state
const TableSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex flex-row items-center gap-3">
        <div className="w-full max-w-xl">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <Card className="rounded-md border">
        <div className="p-4">
          {/* Header skeleton */}
          <div className="flex space-x-4 pb-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Rows skeleton */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex space-x-4 py-3 border-t">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

// Interface untuk filter parameters sesuai dengan tRPC schema
export interface EmployeeFilters {
  page: number;
  limit: number;
  search?: string;
  gender?: Gender[];
  isActive?: boolean;
  activeMonth?: number;
  activeYear?: number;
}

export const EmployeeUpdateDataTable = () => {
  const [dataEmployee, setDataEmployee] = useState<EmployeeColumns[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    limit: 50,
  });

  const {
    data: dataEmployeeTrpc,
    isLoading: isLoadingEmployee,
    refetch: refetchDataEmployee,
    error: employeeError,
  } = trpc.Employee.getAllEmployee.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const deleteEmployee = trpc.Employee.deleteEmployee.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDataEmployee();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus data karyawan");
    },
    onSettled: () => {
      // setDeletingId(null);
    },
  });

  // Handle actions
  const handleViewEmployee = (employee: EmployeeColumns) => {
    setSelectedEmployeeId(employee.id);
  };

  const handleEditEmployee = (employee: EmployeeColumns) => {
    router.push(`/dashboard/karyawan/edit/${employee.id}`);
  };

  const handleDeleteEmployee = (employee: EmployeeColumns) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus karyawan "${employee.name}"?`
      )
    ) {
      deleteEmployee.mutate({ id: employee.id });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataEmployeeTrpc?.data && Array.isArray(dataEmployeeTrpc.data)) {
      try {
        const transformedEmployee: EmployeeColumns[] =
          dataEmployeeTrpc.data.map((employee) => {
            // Ambil employment terbaru (index 0 karena sudah di-sort by startDate desc)
            const latestEmployment = employee.employments?.[0];

            return {
              id: employee.id,
              nik: employee.nik,
              name: employee.name,
              isActive: employee.isActive,
              activeDate: employee.activeDate,
              gender: employee.gender,
              address: employee.address,
              city: employee.city,
              zipcode: employee.zipcode,
              phoneNumber: employee.phoneNumber,
              photo: employee.photo,
              ttdDigital: employee.ttdDigital,
              resignDate: employee.resignDate,
              // Data dari employment terbaru
              position: latestEmployment?.position || null,
              division: latestEmployment?.division || null,
              employments: employee.employments || [],
            };
          });

        setDataEmployee(transformedEmployee);
      } catch (error) {
        console.error("Error transforming employee data:", error);
        toast.error("Terjadi kesalahan saat memproses data karyawan");
        setDataEmployee([]);
      }
    }
  }, [dataEmployeeTrpc]);

  // Function untuk update filters
  const updateFilters = (newFilters: Partial<EmployeeFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  };

  // Handle error state
  if (employeeError) {
    console.error("Employee fetch error:", employeeError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {employeeError.message ||
              "Terjadi kesalahan saat memuat data karyawan"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataEmployee()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => setFilters({ page: 1, limit: 50 })}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Show skeleton while loading
  if (isLoadingEmployee) {
    return <TableSkeleton />;
  }

  // Create columns with actions
  const columnsWithActions = employeeColumns({
    onView: handleViewEmployee,
    onEdit: handleEditEmployee,
    onDelete: handleDeleteEmployee,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination */}
      {dataEmployeeTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataEmployee.length} dari {dataEmployeeTrpc.total} total
          karyawan
          {dataEmployeeTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataEmployeeTrpc.page} dari{" "}
              {dataEmployeeTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedEmployeeId && (
        <ViewEmployee
          employeeId={selectedEmployeeId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmployeeId(null);
            }
          }}
        />
      )}

      <EmployeeDataTable columns={columnsWithActions} data={dataEmployee} />

      {/* Load more button */}
      {dataEmployeeTrpc &&
        dataEmployeeTrpc.totalPages > dataEmployeeTrpc.page && (
          <div className="flex justify-center">
            <button
              onClick={() =>
                updateFilters({
                  page: filters.page + 1,
                  limit: filters.limit + 50,
                })
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={isLoadingEmployee}
            >
              {isLoadingEmployee ? "Memuat..." : "Muat Lebih Banyak"}
            </button>
          </div>
        )}
    </div>
  );
};
