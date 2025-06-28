"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { MaterialForm, MaterialFormData } from "./MaterialForm";

interface materialEditPageProps {
  id: string;
}

export const MaterialEditPage = ({ id }: materialEditPageProps) => {
  const router = useRouter();

  const {
    data: dataMaterial,
    isLoading,
    refetch: refetchDataMaterial,
    error,
  } = trpc.Material.getMaterialById.useQuery({ id });

  const handleSuccess = () => {
    router.push("/dashboard/material");
  };

  const handleCancel = () => {
    router.push("/dashboard/material");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">
              Memuat data material...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("data Material fetch error:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {error.message || "Terjadi kesalahan saat memuat data material"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataMaterial()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dataMaterial) {
    return (
      <div className="container mx-auto ">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                data material tidak ditemukan
              </p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Material
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const materialFormData: MaterialFormData = {
    id: dataMaterial.id,
    code: dataMaterial.code,
    name: dataMaterial.name,
    description: dataMaterial.description,
    category: dataMaterial.category,
    unit: dataMaterial.unit,
    brand: dataMaterial.brand,
    currentStock: dataMaterial.currentStock,
    minimumStock: dataMaterial.minimumStock,
    maximumStock: dataMaterial.maximumStock,
    goodStock: dataMaterial.goodStock,
    badStock: dataMaterial.badStock,
    lastPurchasePrice: dataMaterial.lastPurchasePrice?.toNumber() ?? undefined,
  };

  return (
    <div className="container  max-w-4xl mx-auto  space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Supplier :{" "}
            <span className="text-xl text-muted-foreground uppercase  font-medium">
              {dataMaterial.name}
            </span>
          </h1>
          <p className="text-muted-foreground">Perbarui informasi Material</p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      {/* Form */}
      <MaterialForm
        material={materialFormData}
        mode="edit"
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
