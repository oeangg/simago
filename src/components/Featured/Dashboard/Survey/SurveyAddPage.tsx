"use client";
// Di parent component (misal: CreateMaterialInPage.tsx)
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { SurveyForm } from "./SurveyForm";

export function SurveyAddPage() {
  const router = useRouter();

  const { data: customers, isLoading: isLoadingCustomers } =
    trpc.survey.getActiveCustomers.useQuery();

  const handleCancel = () => {
    router.push("/dashboard/survey");
  };

  if (isLoadingCustomers) {
    return (
      <div className="container mx-auto ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Memuat data ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customers) {
    return (
      <div className="p-4">
        <p>Failed to load data</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Survey</h1>
          <p className="text-muted-foreground">Tambah data Survey </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      <SurveyForm customers={customers} mode="create" onCancel={handleCancel} />
    </div>
  );
}
