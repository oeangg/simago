"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Gender, VehicleType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { VehicleColumns, VehicleColumnsProps } from "./Columns";
import ViewVehicle from "./VehicleView";
import { VehicleDataTable } from "./DataTable";

// Interface untuk filter parameters sesuai dengan tRPC schema
export interface VehicleFilters {
  page: number;
  limit: number;
  search?: string;
  gender?: Gender[];
}

export const IndexPageVehicleDataTable = () => {
  const [dataVehicle, setDataVehicle] = useState<VehicleColumnsProps[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<VehicleFilters>({
    page: 1,
    limit: 50,
  });

  const {
    data: dataVehicleTrpc,
    isLoading: isLoadingVehicle,
    refetch: refetchDataVehicle,
    error: vehicleError,
  } = trpc.Vehicle.getAllVehicle.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const deleteVehicle = trpc.Vehicle.deleteVehicle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDataVehicle();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus data kendaraan");
    },
    onSettled: () => {
      // setDeletingId(null);
    },
  });

  // Handle actions
  const handleViewVehicle = (vehicle: VehicleColumnsProps) => {
    setSelectedVehicleId(vehicle.id);
  };

  const handleEditVehicle = (vehicle: VehicleColumnsProps) => {
    router.push(`/dashboard/kendaraan/edit/${vehicle.id}`);
  };

  const handleDeleteVehicle = (vehicle: VehicleColumnsProps) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus kendaraan "${vehicle.vehicleNumber}"?`
      )
    ) {
      deleteVehicle.mutate({ id: vehicle.id });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataVehicleTrpc?.data && Array.isArray(dataVehicleTrpc.data)) {
      try {
        const transformedVehicle: VehicleColumnsProps[] =
          dataVehicleTrpc.data.map((vehicle) => {
            return {
              id: vehicle.id,
              vehicleNumber: vehicle.vehicleNumber,
              vehicleType: vehicle.vehicleType as VehicleType,
              vehicleMake: vehicle.vehicleMake || "",
              vehicleYear: vehicle.vehicleYear || "",
            };
          });

        setDataVehicle(transformedVehicle);
      } catch (error) {
        console.error("Error transforming kendaraan data:", error);
        toast.error("Terjadi kesalahan saat memproses data kendaraan");
        setDataVehicle([]);
      }
    }
  }, [dataVehicleTrpc]);

  // Function untuk update filters
  const updateFilters = (newFilters: Partial<VehicleFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  };

  // Handle error state
  if (vehicleError) {
    console.error("Employee fetch error:", vehicleError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {vehicleError.message ||
              "Terjadi kesalahan saat memuat data kendaran"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataVehicle()}
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
  const columnsWithActions = VehicleColumns({
    onView: handleViewVehicle,
    onEdit: handleEditVehicle,
    onDelete: handleDeleteVehicle,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination */}
      {dataVehicleTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataVehicle.length} dari {dataVehicleTrpc.total} total
          kendaraan
          {dataVehicleTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataVehicleTrpc.page} dari {dataVehicleTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedVehicleId && (
        <ViewVehicle
          vehicleId={selectedVehicleId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedVehicleId(null);
            }
          }}
        />
      )}

      <VehicleDataTable
        columns={columnsWithActions}
        data={dataVehicle}
        isLoading={isLoadingVehicle}
      />

      {/* Load more button */}
      {dataVehicleTrpc && dataVehicleTrpc.totalPages > dataVehicleTrpc.page && (
        <div className="flex justify-center">
          <button
            onClick={() =>
              updateFilters({
                page: filters.page + 1,
                limit: filters.limit + 50,
              })
            }
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            disabled={isLoadingVehicle}
          >
            {isLoadingVehicle ? "Memuat..." : "Muat Lebih Banyak"}
          </button>
        </div>
      )}
    </div>
  );
};
