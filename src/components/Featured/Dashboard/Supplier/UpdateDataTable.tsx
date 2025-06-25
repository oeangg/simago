"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/app/_trpcClient/client";

import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { StatusActive, SupplierType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { supplierColumns, SupplierColumnsProps } from "./Columns";
import { SupplierDataTable } from "./DataTable";
import ViewSupplier from "./SupplierView";

// Skeleton component untuk loading state
const SupplierTableSkeleton = () => {
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
export interface SupplierFilters {
  page: number;
  limit: number;
  search?: string;
  supplierType?: SupplierType;
  statusActive?: StatusActive;
}

export const SupplierUpdateDataTable = () => {
  const [dataSupplier, setDataSupplier] = useState<SupplierColumnsProps[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null
  );

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<SupplierFilters>({
    page: 1,
    limit: 50, // Ambil lebih banyak data untuk table
  });

  const {
    data: dataSupplierTrpc,
    isLoading: isLoadingSupplier,
    refetch: refetchDataSupplier,
    error: supplierError,
  } = trpc.Supplier.getAllSuppliers.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Tidak refetch saat window focus
  });

  const deleteSupplier = trpc.Supplier.deleteSupplier.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Supplier berhasil dihapus");
      refetchDataSupplier();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus supplier");
    },
    onSettled: () => {},
  });

  // Handle actions
  const handleViewSupplier = (supplier: SupplierColumnsProps) => {
    setSelectedSupplierId(supplier.id!);
  };

  const handleEditSupplier = (supplier: SupplierColumnsProps) => {
    router.push(`/dashboard/supplier/edit/${supplier.id}`);
  };

  const handleDeleteSupplier = (supplier: SupplierColumnsProps) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus supplier "${supplier.name}"?`
      )
    ) {
      deleteSupplier.mutate({ id: supplier.id! });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataSupplierTrpc?.data && Array.isArray(dataSupplierTrpc.data)) {
      try {
        const transformedSuppliers: SupplierColumnsProps[] =
          dataSupplierTrpc.data
            .filter((supplier) => supplier && typeof supplier === "object") // Filter out invalid entries
            .map((supplier) => {
              // Safely get primary address and contact
              const primaryAddress = supplier.addresses?.[0] || null;
              const primaryContact = supplier.contacts?.[0] || null;

              return {
                id: supplier.id,
                code: supplier.code || "", // Provide fallback for required field
                name: supplier.name || "", // Provide fallback for required field
                supplierType: supplier.supplierType,
                statusActive: supplier.statusActive,
                npwpNumber: supplier.npwpNumber || null,
                activeDate: supplier.activeDate
                  ? new Date(supplier.activeDate)
                  : undefined,

                // Transform addresses - only include primary address
                addresses: primaryAddress
                  ? [
                      {
                        id: primaryAddress.id,
                        addressType: primaryAddress.addressType,
                        addressLine1: primaryAddress.addressLine1 || "",
                        addressLine2: primaryAddress.addressLine2 || null,
                        zipcode: primaryAddress.zipcode || null,
                        isPrimaryAddress:
                          primaryAddress.isPrimaryAddress ?? false,
                        country: primaryAddress.country
                          ? { name: primaryAddress.country.name || "" }
                          : null,
                        province: primaryAddress.province
                          ? { name: primaryAddress.province.name || "" }
                          : null,
                        regency: primaryAddress.regency
                          ? { name: primaryAddress.regency.name || "" }
                          : null,
                        district: primaryAddress.district
                          ? { name: primaryAddress.district.name || "" }
                          : null,
                      },
                    ]
                  : [],

                // Transform contacts - only include primary contact
                contacts: primaryContact
                  ? [
                      {
                        id: primaryContact.id,
                        contactType: primaryContact.contactType,
                        name: primaryContact.name || "",
                        phoneNumber: primaryContact.phoneNumber || "",
                        email: primaryContact.email || null,
                        isPrimaryContact:
                          primaryContact.isPrimaryContact ?? false,
                      },
                    ]
                  : [],
              };
            });

        setDataSupplier(transformedSuppliers);
      } catch (error) {
        console.error("Error transforming supplier data:", error);
        toast.error("Terjadi kesalahan saat memproses data supplier");
        setDataSupplier([]);
      }
    } else if (
      dataSupplierTrpc?.data === null ||
      dataSupplierTrpc?.data === undefined
    ) {
      // Handle case when data is explicitly null/undefined
      setDataSupplier([]);
    }
  }, [dataSupplierTrpc?.data]);

  // Function untuk update filters (bisa digunakan untuk search dan filter nanti)
  const updateFilters = (newFilters: Partial<SupplierFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset ke page 1 jika ada filter baru
    }));
  };

  // Handle error state
  if (supplierError) {
    console.error("Supplier fetch error:", supplierError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {supplierError.message ||
              "Terjadi kesalahan saat memuat data supplier"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataSupplier()}
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
  if (isLoadingSupplier) {
    return <SupplierTableSkeleton />;
  }

  // Create columns with actions
  const columnsWithActions = supplierColumns({
    onView: handleViewSupplier,
    onEdit: handleEditSupplier,
    onDelete: handleDeleteSupplier,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination (opsional) */}
      {dataSupplierTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataSupplier.length} dari {dataSupplierTrpc.total} total
          supplier
          {dataSupplierTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataSupplierTrpc.page} dari{" "}
              {dataSupplierTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedSupplierId && (
        <ViewSupplier
          supplierId={selectedSupplierId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSupplierId(null);
            }
          }}
        />
      )}

      <SupplierDataTable columns={columnsWithActions} data={dataSupplier} />

      {/* Load more button jika ada data lebih banyak */}
      {dataSupplierTrpc &&
        dataSupplierTrpc.totalPages > dataSupplierTrpc.page && (
          <div className="flex justify-center">
            <button
              onClick={() =>
                updateFilters({
                  page: filters.page + 1,
                  limit: filters.limit + 50,
                })
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={isLoadingSupplier}
            >
              {isLoadingSupplier ? "Memuat..." : "Muat Lebih Banyak"}
            </button>
          </div>
        )}
    </div>
  );
};
