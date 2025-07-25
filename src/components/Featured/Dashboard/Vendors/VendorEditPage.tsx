"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { VendorForm } from "./VendorForm";

interface vendorEditPageProps {
  id: string;
}

export const VendorEditPage = ({ id }: vendorEditPageProps) => {
  const router = useRouter();
  const vendorId = id;

  const {
    data: dataVendor,
    isLoading,
    refetch: refetchDataVendor,
    error,
  } = trpc.Vendor.getVendorById.useQuery({ id: vendorId });

  const handleSuccess = () => {
    router.push("/dashboard/vendor");
  };

  const handleCancel = () => {
    router.push("/dashboard/vendor");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Memuat data vendor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Supplier fetch error:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {error.message || "Terjadi kesalahan saat memuat data vendor"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataVendor()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dataVendor) {
    return (
      <div className="container mx-auto ">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Vendor tidak ditemukan</p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Vendor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // const dataVendortoFrontend = dataVendor
  //   ? {
  //       ...dataVendor,
  //       activeDate: dataVendor.activeDate.toISOString().split("T")[0],
  //       npwpDate: dataVendor.npwpDate?.toISOString().split("T")[0] || null,
  //     }
  //   : undefined;

  return (
    <div className="container  max-w-4xl mx-auto  space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Vendor :{" "}
            <span className="text-xl text-muted-foreground uppercase  font-medium">
              {dataVendor.name}
            </span>
          </h1>
          <p className="text-muted-foreground">Perbarui informasi Vendor</p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      {/* Form */}
      <VendorForm
        vendor={dataVendor}
        mode="edit"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};
