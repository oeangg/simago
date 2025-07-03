"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, X, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { SurveyForm } from "./SurveyForm";
import { Badge } from "@/components/ui/badge";

interface SurveyEditPageProps {
  id: string;
}

export const SurveyEditPage = ({ id }: SurveyEditPageProps) => {
  const router = useRouter();

  // Fetch customers untuk dropdown
  const { data: customers, isLoading: loadingCustomers } =
    trpc.survey.getActiveCustomers.useQuery();

  // Fetch survey data by ID
  const {
    data: surveyData,
    isLoading: loadingSurvey,
    refetch: refetchSurvey,
    error,
  } = trpc.survey.getSurveyById.useQuery(
    { id },
    {
      enabled: !!id,
    }
  );

  const isLoading = loadingCustomers || loadingSurvey;

  const handleSuccess = () => {
    router.push("/dashboard/survey");
  };

  const handleCancel = () => {
    router.push("/dashboard/survey");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Memuat data survey...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md border-destructive/20">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {error.message || "Terjadi kesalahan saat memuat data survey"}
          </p>
          <div className="space-y-2">
            <Button onClick={() => refetchSurvey()} className="w-full">
              Coba Lagi
            </Button>
            <Button onClick={handleCancel} variant="outline" className="w-full">
              Kembali
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if required data exists
  if (!surveyData || !customers) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Data survey tidak ditemukan atau data customer tidak lengkap
              </p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate survey data
  if (!surveyData.id || !surveyData.surveyDate) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Data survey tidak valid atau rusak
              </p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if survey can be edited (not approved)
  const canEdit = surveyData.statusSurvey !== "APPROVED";

  if (!canEdit) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Survey Tidak Dapat Diubah
              </h3>
              <p className="text-gray-600 mb-4">
                Survey dengan status &#34;Approved&#34; tidak dapat diubah
              </p>
              <div className="mb-4">
                <Badge className="bg-green-100 text-green-800">
                  Status: Approved
                </Badge>
              </div>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform survey data untuk SurveyForm
  const transformedSurveyData = {
    id: surveyData.id,
    surveyNo: surveyData.surveyNo,
    surveyDate: new Date(surveyData.surveyDate),
    workDate: new Date(surveyData.workDate),
    customerId: surveyData.customerId,
    origin: surveyData.origin,
    destination: surveyData.destination,
    cargoType: surveyData.cargoType,
    shipmentType: surveyData.shipmentType,
    shipmentDetail: surveyData.shipmentDetail,
    statusSurvey: surveyData.statusSurvey,
    customer: {
      id: surveyData.customers.id,
      code: surveyData.customers.code,
      name: surveyData.customers.name,
    },
    surveyItems: surveyData.surveyItems.map((item) => ({
      id: item.id,
      name: item.name,
      width: Number(item.width) || 0,
      length: Number(item.length) || 0,
      height: Number(item.height) || 0,
      quantity: Number(item.quantity) || 0,
      cbm: Number(item.cbm) || 0,
      note: item.note,
    })),
  };

  // Transform customers data
  const transformedCustomers = customers.map((customer) => ({
    id: customer.id,
    code: customer.code,
    name: customer.name,
    contacts: customer.contacts || [],
  }));

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ONPROGRESS: {
        label: "On Progress",
        className: "bg-blue-100 text-blue-800",
      },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECT: { label: "Rejected", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={config?.className || "bg-gray-100 text-gray-800"}>
        {config?.label || status}
      </Badge>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Survey Cargo
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  No. Survey:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {surveyData.surveyNo}
                  </span>
                </span>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  {getStatusBadge(surveyData.statusSurvey)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Informasi Penting</h4>
              <p className="text-sm text-blue-700 mt-1">
                Pastikan semua data yang diubah sudah benar. Survey yang sudah
                disetujui tidak dapat diubah kembali.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Survey Form */}
      <SurveyForm
        survey={transformedSurveyData}
        customers={transformedCustomers}
        mode="edit"
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
