"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { MaterialInColumns, MaterialInColumnsProps } from "./Columns";
import { MaterialInDataTable } from "./DataTable";
import ViewMaterialIn from "./MaterialInView";
import { DateRange } from "react-day-picker";
import { useDebounce } from "use-debounce";
import { endOfDay } from "date-fns";

// Error component dengan TRPC typing

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  // Extract error message safely
  const errorMessage = (() => {
    if (error && typeof error === "object" && "message" in error) {
      return String(error.message);
    }
    return "Terjadi kesalahan saat memuat data pembelian material";
  })();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-6 text-center max-w-md">
        <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
        <p className="text-destructive mb-4 text-sm">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Coba Lagi
        </button>
      </Card>
    </div>
  );
};

export const IndexPageMaterialInDataTable = () => {
  const router = useRouter();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearch] = useDebounce(searchTerm, 1000); // 500ms delay
  // Query untuk fetch data
  const {
    data: response,
    isLoading,
    refetch,
    error,
  } = trpc.MaterialIn.getMaterialInAll.useQuery(
    {
      page: 1,
      limit: 100,
      search: debouncedSearch,
      startDate: dateRange?.from,
      endDate: dateRange?.to ? endOfDay(dateRange.to) : dateRange?.to,
      sortBy: "transactionDate",
      sortOrder: "desc",
    },
    {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Delete mutation
  const deleteMutation = trpc.MaterialIn.deleteMaterialIn.useMutation({
    onSuccess: () => {
      toast.success("Pembelian material berhasil dihapus");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus data");
    },
  });

  // Transform data untuk table dengan validation
  const tableData: MaterialInColumnsProps[] =
    response?.data
      ?.filter((item) => {
        // Filter out items dengan data tidak lengkap
        return item.id && item.transactionDate;
      })
      .map((item) => ({
        id: item.id!, // Safe karena sudah di-filter
        transactionNo: item.transactionNo || "",
        supplierId: item.supplierId || "",
        supplierName: item.supplierName || "",
        transactionDate: item.transactionDate!, // Safe karena sudah di-filter
        invoiceNo: item.invoiceNo ?? undefined,
        totalAmountBeforeTax: item.totalAmountBeforeTax || 0,
        totalTax: item.totalTax ?? undefined,
        otherCosts: item.otherCosts ?? undefined,
        totalAmount: item.totalAmount || 0,
        notes: item.notes ?? undefined,
        items: (item.items || []).map((subItem) => ({
          id: subItem.id || "",
          materialId: subItem.materialId || "",
          quantity: subItem.quantity || 0,
          unitPrice: subItem.unitPrice || 0,
          stockType: subItem.stockType,
          totalPrice: subItem.totalPrice || 0,
          notes: subItem.notes ?? undefined,
        })),
      })) || [];

  // Action handlers
  const handleView = (material: MaterialInColumnsProps) => {
    setSelectedMaterialId(material.id);
  };

  const handleEdit = (material: MaterialInColumnsProps) => {
    router.push(`/dashboard/pembelian-material/edit/${material.id}`);
  };

  const handleDelete = (material: MaterialInColumnsProps) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus transaksi "${material.transactionNo}"?`
    );

    if (confirmed) {
      deleteMutation.mutate({ id: material.id });
    }
  };

  // Handle loading state
  // if (isLoading && !tableData.length) {
  //   return <TableSkeleton />;
  // }

  // Handle error state
  if (error && !isLoading) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Create columns with actions
  const columns = MaterialInColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-4">
      {/* Data info */}
      {response && (
        <div className="text-sm text-muted-foreground">
          Total {response.total} pembelian material
        </div>
      )}

      {/* Data table */}
      <MaterialInDataTable
        columns={columns}
        data={tableData}
        onSearchChange={setSearchTerm}
        onDateRangeChange={setDateRange}
        searchValue={searchTerm}
        dateRangeValue={dateRange}
        isLoading={isLoading}
      />

      {/* View dialog */}
      {selectedMaterialId && (
        <ViewMaterialIn
          materialInId={selectedMaterialId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMaterialId(null);
            }
          }}
        />
      )}
    </div>
  );
};
