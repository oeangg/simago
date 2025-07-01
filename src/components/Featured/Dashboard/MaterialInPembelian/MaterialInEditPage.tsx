"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { MaterialInForm } from "./MaterialInputForm";

interface MaterialInEditPageProps {
  id: string;
}

export const MaterialInEditPage = ({ id }: MaterialInEditPageProps) => {
  const router = useRouter();

  // Fetch materials dan suppliers
  const { data: materials, isLoading: loadingMaterials } =
    trpc.Material.getAllMaterial.useQuery({
      limit: 50,
    });

  const { data: suppliers, isLoading: loadingSuppliers } =
    trpc.Supplier.getAllSuppliers.useQuery({
      limit: 50,
    });

  const {
    data: dataPembelianMaterial,
    isLoading: loadingMaterialIn,
    refetch: refetchDataMaterialIn,
    error,
  } = trpc.MaterialIn.getMaterialInById.useQuery(
    { id },
    {
      enabled: !!id,
    }
  );

  const isLoading = loadingMaterials || loadingSuppliers || loadingMaterialIn;

  const handleSuccess = () => {
    router.push("/dashboard/pembelian-material");
  };

  const handleCancel = () => {
    router.push("/dashboard/pembelian-material");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {error.message || "Terjadi kesalahan saat memuat data"}
          </p>
          <div className="space-y-2">
            <Button onClick={() => refetchDataMaterialIn()} className="w-full">
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

  // Check all required data exists
  if (!dataPembelianMaterial || !materials?.data || !suppliers?.data) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Data pembelian material tidak ditemukan atau data master tidak
                lengkap
              </p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Pembelian Material
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure all fields are defined before passing to form
  if (!dataPembelianMaterial.id || !dataPembelianMaterial.transactionDate) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Data pembelian material tidak valid
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

  // Transform and validate data untuk MaterialInForm
  const materialInData = {
    id: dataPembelianMaterial.id,
    transactionNo: dataPembelianMaterial.transactionNo || "",
    supplierId: dataPembelianMaterial.supplierId || "",
    supplierName: dataPembelianMaterial.supplierName || "",
    transactionDate: new Date(dataPembelianMaterial.transactionDate),
    invoiceNo: dataPembelianMaterial.invoiceNo || null,
    totalAmountBeforeTax:
      Number(dataPembelianMaterial.totalAmountBeforeTax) || 0,
    totalTax: dataPembelianMaterial.totalTax
      ? Number(dataPembelianMaterial.totalTax)
      : null,
    otherCosts: dataPembelianMaterial.otherCosts
      ? Number(dataPembelianMaterial.otherCosts)
      : null,
    totalAmount: Number(dataPembelianMaterial.totalAmount) || 0,
    notes: dataPembelianMaterial.notes || null,
    items: (dataPembelianMaterial.items || []).map((item) => ({
      id: item.id || "",
      materialId: item.materialId || "",
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      stockType: item.stockType,
      totalPrice: Number(item.totalPrice) || 0,
      notes: item.notes || null,
    })),
  };

  const materialData =
    materials?.data?.map((mat) => ({
      ...mat,
      lastPurchasePrice: mat.lastPurchasePrice
        ? Number(mat.lastPurchasePrice)
        : null,
      // Convert other Decimal fields if any
    })) || [];

  return (
    <div className="container max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Pembelian Material
          </h1>
          <p className="text-muted-foreground">
            No. Transaksi:{" "}
            <span className="font-medium">
              {dataPembelianMaterial.transactionNo}
            </span>
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>

      {/* Form */}
      <MaterialInForm
        suppliers={suppliers.data}
        materials={materialData}
        mode="edit"
        onCancel={handleCancel}
        materialIn={materialInData}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
