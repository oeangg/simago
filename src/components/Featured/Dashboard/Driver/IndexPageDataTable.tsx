"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Gender } from "@prisma/client";
import { useRouter } from "next/navigation";
import { driverColumns, DriverColumnsProps } from "./Columns";
import { DriverDataTable } from "./DataTable";
import ViewDriver from "./DriverView";

// Interface untuk filter parameters sesuai dengan tRPC schema
export interface DriverFilters {
  page: number;
  limit: number;
  search?: string;
  gender?: Gender[];
  statusActive?: boolean;
}

export const IndexPageDriverDataTable = () => {
  const [dataDriver, setDataDriver] = useState<DriverColumnsProps[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<DriverFilters>({
    page: 1,
    limit: 50,
  });

  const {
    data: dataDriverTrpc,
    isLoading: isLoadingDriver,
    refetch: refetchDatadriver,
    error: driverError,
  } = trpc.Driver.getAllDrivers.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const deleteDriver = trpc.Driver.deleteDriver.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDatadriver();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus data driver");
    },
    onSettled: () => {
      // setDeletingId(null);
    },
  });

  // Handle actions
  const handleViewdriver = (driver: DriverColumnsProps) => {
    setSelectedDriverId(driver.id);
  };

  const handleEditDriver = (driver: DriverColumnsProps) => {
    router.push(`/dashboard/driver/edit/${driver.id}`);
  };

  const handleDeleteDriver = (driver: DriverColumnsProps) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus driver "${driver.name}"?`
      )
    ) {
      deleteDriver.mutate({ id: driver.id });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataDriverTrpc?.data && Array.isArray(dataDriverTrpc.data)) {
      try {
        const transformedDriver: DriverColumnsProps[] = dataDriverTrpc.data.map(
          (driver) => {
            return {
              id: driver.id,
              code: driver.code,
              name: driver.name,
              gender: driver.gender as Gender,
              addressLine1: driver.addressLine1,
              addressLine2: driver.addressLine2 || "",
              city: driver.city,
              phoneNumber: driver.phoneNumber,
              statusActive: driver.statusActive,

              activeDate: driver.activeDate,
            };
          }
        );

        setDataDriver(transformedDriver);
      } catch (error) {
        console.error("Error transforming driver data:", error);
        toast.error("Terjadi kesalahan saat memproses data driver");
        setDataDriver([]);
      }
    }
  }, [dataDriverTrpc]);

  // Function untuk update filters
  const updateFilters = (newFilters: Partial<DriverFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  };

  // Handle error state
  if (driverError) {
    console.error("Employee fetch error:", driverError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {driverError.message || "Terjadi kesalahan saat memuat data driver"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDatadriver()}
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

  // Create columns with actions
  const columnsWithActions = driverColumns({
    onView: handleViewdriver,
    onEdit: handleEditDriver,
    onDelete: handleDeleteDriver,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination */}
      {dataDriverTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataDriver.length} dari {dataDriverTrpc.total} total
          driver
          {dataDriverTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataDriverTrpc.page} dari {dataDriverTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedDriverId && (
        <ViewDriver
          driverId={selectedDriverId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDriverId(null);
            }
          }}
        />
      )}

      <DriverDataTable
        columns={columnsWithActions}
        data={dataDriver}
        isLoading={isLoadingDriver}
      />

      {/* Load more button */}
      {dataDriverTrpc && dataDriverTrpc.totalPages > dataDriverTrpc.page && (
        <div className="flex justify-center">
          <button
            onClick={() =>
              updateFilters({
                page: filters.page + 1,
                limit: filters.limit + 50,
              })
            }
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            disabled={isLoadingDriver}
          >
            {isLoadingDriver ? "Memuat..." : "Muat Lebih Banyak"}
          </button>
        </div>
      )}
    </div>
  );
};
