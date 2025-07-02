"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/app/_trpcClient/client";

import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { MaterialColumns, MaterialColumnsProps } from "./Columns";
import ViewMaterial from "./MaterialView";
import { MaterialDataTable } from "./DataTable";

// Interface untuk filter parameters sesuai dengan tRPC schema
export interface MaterialFilters {
  page: number;
  limit: number;
  search?: string;
}

export const MaterialUpdateDataTable = () => {
  const [dataMaterial, setDataMaterial] = useState<MaterialColumnsProps[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null
  );

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<MaterialFilters>({
    page: 1,
    limit: 50, // Ambil lebih banyak data untuk table
  });

  const {
    data: dataMaterialTrpc,
    isLoading: isLoadingMaterial,
    refetch: refetchDataMaterial,
    error: materialError,
  } = trpc.Material.getAllMaterial.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Tidak refetch saat window focus
  });

  const deleteMaterial = trpc.Material.deleteMaterial.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Material berhasil dihapus");
      refetchDataMaterial();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus data material");
    },
    onSettled: () => {},
  });

  // Handle actions
  const handleViewMaterial = (material: MaterialColumnsProps) => {
    setSelectedMaterialId(material.id!);
  };

  const handleEditMaterial = (material: MaterialColumnsProps) => {
    router.push(`/dashboard/material/edit/${material.id}`);
  };

  const handleDeleteMaterial = (material: MaterialColumnsProps) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus material "${material.name}"?`
      )
    ) {
      deleteMaterial.mutate({ id: material.id! });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataMaterialTrpc?.data && Array.isArray(dataMaterialTrpc.data)) {
      try {
        const transformedDataMaterial: MaterialColumnsProps[] =
          dataMaterialTrpc.data
            .filter((material) => material && typeof material === "object") // Filter out invalid entries
            .map((materialData) => {
              // Safely get primary address and contact

              return {
                id: materialData.id,
                code: materialData.code,
                name: materialData.name,
                description: materialData.description || "",
                category: materialData.category,
                unit: materialData.unit,
                brand: materialData.brand,
                minimumStock: materialData.minimumStock,
                maximumStock: materialData.maximumStock ?? undefined,
                goodStock: materialData.goodStock ?? undefined,
                badStock: materialData.badStock ?? undefined,
                lastPurchasePrice: materialData.lastPurchasePrice
                  ? parseFloat(materialData.lastPurchasePrice.toString())
                  : undefined,
              };
            });

        setDataMaterial(transformedDataMaterial);
      } catch (error) {
        console.error("Error transforming material data:", error);
        toast.error("Terjadi kesalahan saat memproses data material");
        setDataMaterial([]);
      }
    } else if (
      dataMaterialTrpc?.data === null ||
      dataMaterialTrpc?.data === undefined
    ) {
      setDataMaterial([]);
    }
  }, [dataMaterialTrpc?.data]);

  // Function untuk update filters (bisa digunakan untuk search dan filter nanti)
  const updateFilters = (newFilters: Partial<MaterialFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset ke page 1 jika ada filter baru
    }));
  };

  // Handle error state
  if (materialError) {
    console.error("Supplier fetch error:", materialError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {materialError.message ||
              "Terjadi kesalahan saat memuat data material"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataMaterial()}
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
  const columnsWithActions = MaterialColumns({
    onView: handleViewMaterial,
    onEdit: handleEditMaterial,
    onDelete: handleDeleteMaterial,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination (opsional) */}
      {dataMaterialTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataMaterial.length} dari {dataMaterialTrpc.total} total
          supplier
          {dataMaterialTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataMaterialTrpc.page} dari{" "}
              {dataMaterialTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedMaterialId && (
        <ViewMaterial
          materialId={selectedMaterialId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMaterialId(null);
            }
          }}
        />
      )}

      <MaterialDataTable
        columns={columnsWithActions}
        data={dataMaterial}
        isLoading={isLoadingMaterial}
      />

      {/* Load more button jika ada data lebih banyak */}
      {dataMaterialTrpc &&
        dataMaterialTrpc.totalPages > dataMaterialTrpc.page && (
          <div className="flex justify-center">
            <button
              onClick={() =>
                updateFilters({
                  page: filters.page + 1,
                  limit: filters.limit + 50,
                })
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={isLoadingMaterial}
            >
              {isLoadingMaterial ? "Memuat..." : "Muat Lebih Banyak"}
            </button>
          </div>
        )}
    </div>
  );
};
