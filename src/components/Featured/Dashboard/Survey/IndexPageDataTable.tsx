"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { useDebounce } from "use-debounce";
import { endOfDay } from "date-fns";
import { SurveyInColumns, SurveyInColumnsProps } from "./Columns";
import ViewSurvey from "./SurveyView";
import { SurveyDataTable } from "./DataTable";
import { useSurveyPDF } from "./SurveyPrintPDF";

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
    return "Terjadi kesalahan saat memuat data";
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

export const IndexPageSurveyDataTable = () => {
  const router = useRouter();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const { downloadPDF } = useSurveyPDF();

  // tRPC utils

  const [debouncedSearch] = useDebounce(searchTerm, 1000); // 500ms delay
  // Query untuk fetch data
  const {
    data: response,
    isLoading,
    refetch,
    error,
  } = trpc.survey.getAllSurvey.useQuery(
    {
      page: 1,
      limit: 100,
      search: debouncedSearch,
      startDate: dateRange?.from,
      endDate: dateRange?.to ? endOfDay(dateRange.to) : dateRange?.to,
      //   status: "ONPROGRESS",
    },
    {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Delete mutation
  const deleteMutation = trpc.survey.deleteSurvey.useMutation({
    onSuccess: () => {
      toast.success("Survey berhasil dihapus");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus data");
    },
  });

  // Transform data untuk table dengan validation
  const tableData: SurveyInColumnsProps[] =
    response?.surveys
      ?.filter((item) => {
        // Filter out items dengan data tidak lengkap
        return item.id && item.surveyDate;
      })
      .map((item) => ({
        id: item.id,
        surveyNo: item.surveyNo,
        surveyDate: new Date(item.surveyDate), // Convert to Date object
        workDate: new Date(item.workDate), // Convert to Date object
        customerId: item.customerId,
        origin: item.origin,
        destination: item.destination,
        cargoType: item.cargoType,
        shipmentType: item.shipmentType,
        shipmentDetail: item.shipmentDetail,
        statusSurvey: item.statusSurvey,
        customer: {
          id: item.customers.id, // Fix: customer instead of customers
          code: item.customers.code, // Fix: customer instead of customers
          name: item.customers.name, // Fix: customer instead of customers
        },
        surveyItems: item.surveyItems.map((surveyItem) => ({
          id: surveyItem.id,
          name: surveyItem.name,
          width: surveyItem.width, // Keep as number
          length: surveyItem.length, // Keep as number
          height: surveyItem.height, // Keep as number
          quantity: surveyItem.quantity, // Keep as number
          cbm: surveyItem.cbm, // Keep as number
          note: surveyItem.note, // Keep as string | null
        })),
      })) || [];

  // Action handlers
  const handleView = (survey: SurveyInColumnsProps) => {
    setSelectedSurveyId(survey.id);
  };

  const handleEdit = (survey: SurveyInColumnsProps) => {
    router.push(`/dashboard/survey/edit/${survey.id}`);
  };

  const handleDelete = (survey: SurveyInColumnsProps) => {
    const canDelete = survey.statusSurvey !== "APPROVED";

    if (!canDelete) {
      toast.error("Survey dengan status 'Approved' tidak dapat dihapus");
      return;
    }

    // Use native confirm for simplicity
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus survey "${survey.surveyNo}"?\n\n` +
        `Customer: ${survey.customer.name}\n` +
        `Rute: ${survey.origin} → ${survey.destination}\n\n` +
        `⚠️ Tindakan ini tidak dapat dibatalkan!`
    );

    if (confirmed) {
      deleteMutation.mutate({ id: survey.id });
    }
  };

  // Handle error state
  if (error && !isLoading) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  const utils = trpc.useUtils();

  const handleRefresh = () => {
    utils.survey.getAllSurvey.invalidate();
  };

  // Create columns with actions
  const columns = SurveyInColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onPrintPdf: downloadPDF,
    onRefresh: handleRefresh,
  });

  return (
    <div className="space-y-4">
      {/* Data info */}
      {response && (
        <div className="text-sm text-muted-foreground">
          Total {response.pagination.total} pembelian material
        </div>
      )}

      {/* Data table */}
      <SurveyDataTable
        columns={columns}
        data={tableData}
        onSearchChange={setSearchTerm}
        onDateRangeChange={setDateRange}
        searchValue={searchTerm}
        dateRangeValue={dateRange}
        isLoading={isLoading}
      />

      {/* View dialog */}
      {selectedSurveyId && (
        <ViewSurvey
          surveyId={selectedSurveyId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSurveyId(null);
            }
          }}
        />
      )}
    </div>
  );
};
