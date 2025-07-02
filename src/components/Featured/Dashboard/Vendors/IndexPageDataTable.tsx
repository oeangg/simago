"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/app/_trpcClient/client";

import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { StatusActive, VendorType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { vendorColumns, VendorColumnsProps } from "./Columns";
import ViewVendor from "./VendorView";
import { VendorDataTable } from "./DataTable";
import { formatDateForInput } from "@/tools/formatDateForInput";

// Interface untuk filter parameters sesuai dengan tRPC schema
export interface VendorFilters {
  page: number;
  limit: number;
  search?: string;
  vendorType?: VendorType;
  statusActive?: StatusActive;
}

export const IndexPageVendorDataTable = () => {
  const [dataVendor, setDataVendor] = useState<VendorColumnsProps[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<VendorFilters>({
    page: 1,
    limit: 50, // Ambil lebih banyak data untuk table
  });

  const {
    data: dataVendorTrpc,
    isLoading: isLoadingVendor,
    refetch: refetchDataVendor,
    error: vendorError,
  } = trpc.Vendor.getAllVendors.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Tidak refetch saat window focus
  });

  const deleteVendor = trpc.Vendor.deleteVendor.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Vendor berhasil dihapus");
      refetchDataVendor();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus vendor");
    },
    onSettled: () => {},
  });

  // Handle actions
  const handleViewVendor = (vendor: VendorColumnsProps) => {
    setSelectedVendorId(vendor.id!);
  };

  const handleEditVendor = (vendor: VendorColumnsProps) => {
    router.push(`/dashboard/vendor/edit/${vendor.id}`);
  };

  const handleDeleteSupplier = (vendor: VendorColumnsProps) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus vendor ${vendor.name} ${vendor.id}  ?`
      )
    ) {
      deleteVendor.mutate({ id: vendor.id! });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataVendorTrpc?.data) {
      try {
        const transformedVendors: VendorColumnsProps[] =
          dataVendorTrpc.data.map((vendor) => {
            // Karena router hanya mengambil primary address dan contact,
            // kita bisa langsung menggunakan data pertama dari array
            const primaryAddress = vendor.vendorAddresses[0] || null;
            const primaryContact = vendor.vendorContacts[0] || null;
            const primaryBanking = vendor.vendorBankings[0] || null;

            return {
              id: vendor.id,
              code: vendor.code,
              name: vendor.name,
              vendorType: vendor.vendorType,
              statusActive: vendor.statusActive,
              activeDate: formatDateForInput(vendor.activeDate),
              picName: vendor.picName || null,
              picPosition: vendor.picPosition || null,
              notes: vendor.notes || null,
              paymentTerms: vendor.paymentTerms,
              npwpNumber: vendor.npwpNumber || null,
              npwpName: vendor.npwpName || null,
              npwpAddress: vendor.npwpAddress || null,
              npwpDate: formatDateForInput(vendor.npwpDate),

              // Transform addresses - karena hanya primary yang diambil
              vendorAddresses: primaryAddress
                ? [
                    {
                      id: primaryAddress.id,
                      addressType: primaryAddress.addressType,
                      addressLine1: primaryAddress.addressLine1,
                      addressLine2: primaryAddress.addressLine2 || null,
                      zipcode: primaryAddress.zipcode || null,
                      isPrimaryAddress: primaryAddress.isPrimaryAddress,
                      country: primaryAddress.country || null,
                      province: primaryAddress.province || null,
                      regency: primaryAddress.regency || null,
                      district: primaryAddress.district || null,
                    },
                  ]
                : [],

              // Transform contacts - karena hanya primary yang diambil
              vendorContacts: primaryContact
                ? [
                    {
                      id: primaryContact.id,
                      contactType: primaryContact.contactType,
                      name: primaryContact.name,
                      faxNumber: primaryContact.faxNumber || null, // Add: missing field
                      phoneNumber: primaryContact.phoneNumber,
                      email: primaryContact.email || null,
                      isPrimaryContact: primaryContact.isPrimaryContact,
                    },
                  ]
                : [],

              // Transform bankings - karena hanya primary yang diambil
              vendorBankings: primaryBanking
                ? [
                    {
                      id: primaryBanking.id,
                      bankingNumber: primaryBanking.bankingNumber,
                      bankingName: primaryBanking.bankingName,
                      bankingBank: primaryBanking.bankingBank,
                      bankingBranch: primaryBanking.bankingBranch,
                      isPrimaryBankingNumber:
                        primaryBanking.isPrimaryBankingNumber,
                    },
                  ]
                : [],
            };
          });

        setDataVendor(transformedVendors);
      } catch (error) {
        console.error("Error transforming vendor data:", error);
        toast.error("Terjadi kesalahan saat memproses data vendor");
        setDataVendor([]);
      }
    }
  }, [dataVendorTrpc]);

  // Function untuk update filters (bisa digunakan untuk search dan filter nanti)
  const updateFilters = (newFilters: Partial<VendorFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset ke page 1 jika ada filter baru
    }));
  };

  // Handle error state
  if (vendorError) {
    console.error("Vendor fetch error:", vendorError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {vendorError.message || "Terjadi kesalahan saat memuat data vendor"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataVendor()}
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
  const columnsWithActions = vendorColumns({
    onView: handleViewVendor,
    onEdit: handleEditVendor,
    onDelete: handleDeleteSupplier,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination (opsional) */}
      {dataVendorTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataVendor.length} dari {dataVendorTrpc.total} total
          vendor
          {dataVendorTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataVendorTrpc.page} dari {dataVendorTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedVendorId && (
        <ViewVendor
          vendorId={selectedVendorId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedVendorId(null);
            }
          }}
        />
      )}

      <VendorDataTable
        columns={columnsWithActions}
        data={dataVendor}
        isLoading={isLoadingVendor}
      />

      {/* Load more button jika ada data lebih banyak */}
      {dataVendorTrpc && dataVendorTrpc.totalPages > dataVendorTrpc.page && (
        <div className="flex justify-center">
          <button
            onClick={() =>
              updateFilters({
                page: filters.page + 1,
                limit: filters.limit + 50,
              })
            }
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            disabled={isLoadingVendor}
          >
            {isLoadingVendor ? "Memuat..." : "Muat Lebih Banyak"}
          </button>
        </div>
      )}
    </div>
  );
};
