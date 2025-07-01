"use client";
// Di parent component (misal: CreateMaterialInPage.tsx)
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/app/_trpcClient/client";
import { MaterialInForm } from "./MaterialInputForm";
import { Button } from "@/components/ui/button";

export function MaterialInAddPage() {
  const router = useRouter();

  // Fetch materials dan suppliers
  const { data: materials, isLoading: loadingMaterials } =
    trpc.Material.getAllMaterial.useQuery({
      limit: 50,
    });

  const { data: suppliers, isLoading: loadingSuppliers } =
    trpc.Supplier.getAllSuppliers.useQuery({
      limit: 100,
    });

  const isLoading = loadingMaterials || loadingSuppliers;

  const handleCancel = () => {
    router.push("/dashboard/pembelian-material");
  };

  if (isLoading) {
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

  if (!materials?.data || !suppliers?.data) {
    return (
      <div className="p-4">
        <p>Failed to load data</p>
      </div>
    );
  }

  const materialData =
    materials?.data?.map((mat) => ({
      ...mat,
      lastPurchasePrice: mat.lastPurchasePrice
        ? Number(mat.lastPurchasePrice)
        : null,
      // Convert other Decimal fields if any
    })) || [];

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pembelian Material
          </h1>
          <p className="text-muted-foreground">Tambah data pembelian </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      <MaterialInForm
        materials={materialData}
        suppliers={suppliers.data}
        mode="create"
        onCancel={handleCancel}
      />
    </div>
  );
}
