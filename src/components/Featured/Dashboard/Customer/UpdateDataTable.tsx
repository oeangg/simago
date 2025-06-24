"use client";

import { useEffect, useState } from "react";
import { CustomerDataTable } from "./DataTable";
import { trpc } from "@/app/_trpcClient/client";
import { customerColumns, CustomerColumnsProps } from "./Columns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { CustomerType, StatusActive } from "@prisma/client";
import { useRouter } from "next/navigation";
import ViewCustomer from "./CustomerView";

// Skeleton component untuk loading state
const CustomerTableSkeleton = () => {
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
export interface CustomerFilters {
  page: number;
  limit: number;
  search?: string;
  customerType?: CustomerType;
  statusActive?: StatusActive;
}

export const CustomerUpdateDataTable = () => {
  const [dataCustomer, setDataCustomer] = useState<CustomerColumnsProps[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  const router = useRouter();

  // Filter state sesuai dengan tRPC schema
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 50, // Ambil lebih banyak data untuk table
  });

  const {
    data: dataCustomerTrpc,
    isLoading: isLoadingCustomer,
    refetch: refetchDataCustomer,
    error: customerError,
  } = trpc.Customer.getAllCustomers.useQuery(filters, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Tidak refetch saat window focus
  });

  const deleteCustomer = trpc.Customer.deleteCustomer.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Customer berhasil dihapus");
      refetchDataCustomer();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus customer");
    },
    onSettled: () => {},
  });

  // Handle actions
  const handleViewCustomer = (customer: CustomerColumnsProps) => {
    setSelectedCustomerId(customer.id!);
  };

  const handleEditCustomer = (customer: CustomerColumnsProps) => {
    console.log("Edit customer:", customer);

    router.push(`/dashboard/customer/edit/${customer.id}`);
  };

  const handleDeleteCustomer = (customer: CustomerColumnsProps) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus customer "${customer.name}"?`
      )
    ) {
      deleteCustomer.mutate({ id: customer.id! });
    }
  };

  // Transform data ketika diterima dari API
  useEffect(() => {
    if (dataCustomerTrpc?.data) {
      try {
        const transformedCustomers: CustomerColumnsProps[] =
          dataCustomerTrpc.data.map((customer) => {
            // Karena router hanya mengambil primary address dan contact,
            // kita bisa langsung menggunakan data pertama dari array
            const primaryAddress = customer.addresses[0] || null;
            const primaryContact = customer.contacts[0] || null;

            return {
              id: customer.id,
              code: customer.code,
              name: customer.name,
              statusActive: customer.statusActive,
              npwpNumber: customer.npwpNumber || "",
              activeDate: customer ? new Date(customer.activeDate) : undefined,
              // createdAt: customer.createdAt
              //   ? new Date(customer.createdAt)
              //   : undefined,

              // Transform addresses - karena hanya primary yang diambil
              addresses: primaryAddress
                ? [
                    {
                      id: primaryAddress.id,
                      addressType: primaryAddress.addressType,
                      addressLine1: primaryAddress.addressLine1,
                      addressLine2: primaryAddress.addressLine2,
                      zipcode: primaryAddress.zipcode,
                      isPrimaryAddress: primaryAddress.isPrimaryAddress,
                      country: primaryAddress.country,
                      province: primaryAddress.province,
                      regency: primaryAddress.regency,
                      district: primaryAddress.district,
                    },
                  ]
                : [],

              // Transform contacts - karena hanya primary yang diambil
              contacts: primaryContact
                ? [
                    {
                      id: primaryContact.id,
                      contactType: primaryContact.contactType,
                      name: primaryContact.name,
                      phoneNumber: primaryContact.phoneNumber,
                      email: primaryContact.email || "",
                      isPrimaryContact: primaryContact.isPrimaryContact,
                    },
                  ]
                : [],
            };
          });

        setDataCustomer(transformedCustomers);
      } catch (error) {
        console.error("Error transforming customer data:", error);
        toast.error("Terjadi kesalahan saat memproses data customer");
        setDataCustomer([]);
      }
    }
  }, [dataCustomerTrpc]);

  // Function untuk update filters (bisa digunakan untuk search dan filter nanti)
  const updateFilters = (newFilters: Partial<CustomerFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset ke page 1 jika ada filter baru
    }));
  };

  // Handle error state
  if (customerError) {
    console.error("Customer fetch error:", customerError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {customerError.message ||
              "Terjadi kesalahan saat memuat data customer"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataCustomer()}
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
  if (isLoadingCustomer) {
    return <CustomerTableSkeleton />;
  }

  // Create columns with actions
  const columnsWithActions = customerColumns({
    onView: handleViewCustomer,
    onEdit: handleEditCustomer,
    onDelete: handleDeleteCustomer,
  });

  return (
    <div className="space-y-4">
      {/* Info pagination (opsional) */}
      {dataCustomerTrpc && (
        <div className="text-sm text-muted-foreground">
          Menampilkan {dataCustomer.length} dari {dataCustomerTrpc.total} total
          customer
          {dataCustomerTrpc.totalPages > 1 && (
            <span>
              {" "}
              (Halaman {dataCustomerTrpc.page} dari{" "}
              {dataCustomerTrpc.totalPages})
            </span>
          )}
        </div>
      )}

      {selectedCustomerId && (
        <ViewCustomer
          customerId={selectedCustomerId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCustomerId(null);
            }
          }}
        />
      )}

      <CustomerDataTable columns={columnsWithActions} data={dataCustomer} />

      {/* Load more button jika ada data lebih banyak */}
      {dataCustomerTrpc &&
        dataCustomerTrpc.totalPages > dataCustomerTrpc.page && (
          <div className="flex justify-center">
            <button
              onClick={() =>
                updateFilters({
                  page: filters.page + 1,
                  limit: filters.limit + 50,
                })
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={isLoadingCustomer}
            >
              {isLoadingCustomer ? "Memuat..." : "Muat Lebih Banyak"}
            </button>
          </div>
        )}
    </div>
  );
};
