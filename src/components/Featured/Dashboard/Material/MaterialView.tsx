"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Loader2,
  AlertCircle,
  Package,
  Tag,
  Box,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Info,
  CheckCircle,
  XCircle,
  Gauge,
  Scale,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { trpc } from "@/app/_trpcClient/client";
import { MaterialCategory } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getInitials } from "@/tools/getInitials";

interface ViewMaterialProps {
  materialId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Helper functions
const formatCurrency = (value: number | null | undefined | Decimal) => {
  if (!value) return "Rp 0";
  // Convert Decimal to number
  const numValue =
    typeof value === "object" && "toNumber" in value
      ? value.toNumber()
      : Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMMM yyyy", { locale: localeId });
};

const getStockStatus = (current: number, min: number, max?: number | null) => {
  if (current <= min) {
    return {
      status: "critical",
      label: "Stok Kritis",
      color: "destructive",
      icon: AlertTriangle,
      percentage: (current / min) * 100,
    };
  }
  if (current <= min * 1.5) {
    return {
      status: "low",
      label: "Stok Rendah",
      color: "warning",
      icon: TrendingDown,
      percentage: (current / (min * 1.5)) * 100,
    };
  }
  if (max && current >= max * 0.9) {
    return {
      status: "high",
      label: "Stok Tinggi",
      color: "secondary",
      icon: TrendingUp,
      percentage: 100,
    };
  }
  return {
    status: "normal",
    label: "Stok Normal",
    color: "success",
    icon: CheckCircle,
    percentage: max ? (current / max) * 100 : 75,
  };
};

const getCategoryDisplay = (category: MaterialCategory) => {
  const categoryMap: Partial<
    Record<MaterialCategory, { label: string; icon: string; color: string }>
  > = {
    RAW_MATERIAL: {
      label: "Bahan Baku",
      icon: "📦",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    CONSUMABLES: {
      label: "Habis Pakai",
      icon: "🔧",
      color: "bg-orange-100 text-orange-800 border-orange-200",
    },
    SPARE_PARTS: {
      label: "Suku Cadang",
      icon: "⚙️",
      color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    PACKAGING: {
      label: "Kemasan",
      icon: "📦",
      color: "bg-teal-100 text-teal-800 border-teal-200",
    },
    TOOLS: {
      label: "Perkakas",
      icon: "🛠️",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
  };
  return (
    categoryMap[category] || {
      label: category,
      icon: "📦",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    }
  );
};

export default function ViewMaterial({
  materialId,
  open,
  onOpenChange,
}: ViewMaterialProps) {
  const {
    data: dataMaterial,
    isLoading,
    error,
    refetch,
  } = trpc.Material.getMaterialById.useQuery(
    { id: materialId },
    {
      enabled: !!open && !!materialId,
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  const renderDialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Memuat data material...
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md border-destructive/20">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
            <p className="text-destructive mb-4 text-sm">
              {error.message || "Terjadi kesalahan saat memuat data material"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!dataMaterial) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Material Tidak Ditemukan
            </h3>
            <p className="text-muted-foreground text-sm">
              Data material dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    const stockStatus = getStockStatus(
      dataMaterial.goodStock,
      dataMaterial.minimumStock,
      dataMaterial.maximumStock
    );
    const StockIcon = stockStatus.icon;
    const categoryDisplay = getCategoryDisplay(dataMaterial.category);

    return (
      <div className="space-y-6">
        {/* Material Header */}
        <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 bg-gradient-to-br text-lg md:text-xl font-medium from-blue-500 to-purple-600 rounded-xl text-white flex items-center justify-center">
                {getInitials(dataMaterial.name)}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {dataMaterial.name}
                    </h2>
                    <p className="text-sm text-gray-600 font-mono">
                      {dataMaterial.code}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("gap-1", categoryDisplay.color)}
                    >
                      <span>{categoryDisplay.icon}</span>
                      {categoryDisplay.label}
                    </Badge>
                    <Badge variant="outline" className="gap-1 justify-center">
                      <Scale className="h-3 w-3" />
                      {dataMaterial.unit}
                    </Badge>
                  </div>
                </div>

                {dataMaterial.description && (
                  <p className="text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
                    {dataMaterial.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Informasi Stok
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Stock Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status Stok</span>
                <Badge
                  variant={
                    stockStatus.color as
                      | "default"
                      | "secondary"
                      | "destructive"
                      | "outline"
                  }
                  className="gap-1"
                >
                  <StockIcon className="w-3 h-3" />
                  {stockStatus.label}
                </Badge>
              </div>
              <Progress
                value={stockStatus.percentage}
                className={cn(
                  "h-2",
                  stockStatus.status === "critical" && "bg-red-100",
                  stockStatus.status === "low" && "bg-yellow-100",
                  stockStatus.status === "high" && "bg-blue-100",
                  stockStatus.status === "normal" && "bg-green-100"
                )}
              />
            </div>

            {/* Stock Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-gray-50 rounded-lg p-3 cursor-help">
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        <Package className="w-3 h-3" />
                        Stok Saat Ini
                      </div>
                      <p className="text-lg font-semibold">
                        {formatNumber(dataMaterial.goodStock)}{" "}
                        {dataMaterial.unit}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Jumlah stok yang tersedia saat ini</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-yellow-50 rounded-lg p-3 cursor-help">
                      <div className="flex items-center gap-2 text-xs text-yellow-700 mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        Stok Minimum
                      </div>
                      <p className="text-lg font-semibold text-yellow-700">
                        {formatNumber(dataMaterial.minimumStock)}{" "}
                        {dataMaterial.unit}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Batas minimum stok sebelum perlu reorder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {dataMaterial.maximumStock && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-blue-50 rounded-lg p-3 cursor-help">
                        <div className="flex items-center gap-2 text-xs text-blue-700 mb-1">
                          <Gauge className="w-3 h-3" />
                          Stok Maximum
                        </div>
                        <p className="text-lg font-semibold text-blue-700">
                          {formatNumber(dataMaterial.maximumStock)}{" "}
                          {dataMaterial.unit}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Batas maksimum stok yang direkomendasikan</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {dataMaterial.lastPurchasePrice && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-green-50 rounded-lg p-3 cursor-help">
                        <div className="flex items-center gap-2 text-xs text-green-700 mb-1">
                          <DollarSign className="w-3 h-3" />
                          Harga Terakhir
                        </div>
                        <p className="text-lg font-semibold text-green-700">
                          {formatCurrency(
                            dataMaterial.lastPurchasePrice?.toNumber()
                          )}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Harga pembelian terakhir per unit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Good & Bad Stock */}
            {(dataMaterial.goodStock !== null ||
              dataMaterial.badStock !== null) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  {dataMaterial.goodStock !== null && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Stok Baik</p>
                        <p className="text-lg font-semibold text-green-700">
                          {formatNumber(dataMaterial.goodStock)}{" "}
                          {dataMaterial.unit}
                        </p>
                      </div>
                    </div>
                  )}

                  {dataMaterial.badStock !== null && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">Stok Rusak</p>
                        <p className="text-lg font-semibold text-red-700">
                          {formatNumber(dataMaterial.badStock)}{" "}
                          {dataMaterial.unit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informasi Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Layers className="w-4 h-4" />
                  <span>Kategori</span>
                </div>
                <div className="pl-6">
                  <Badge
                    variant="secondary"
                    className={cn("gap-1", categoryDisplay.color)}
                  >
                    <span>{categoryDisplay.icon}</span>
                    {categoryDisplay.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Scale className="w-4 h-4" />
                  <span>Satuan</span>
                </div>
                <div className="pl-6">
                  <Badge variant="outline" className="gap-1">
                    <Scale className="h-3 w-3" />
                    {dataMaterial.unit}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span>Merek</span>
                </div>
                <p className="font-medium pl-6">{dataMaterial.brand}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Tanggal Dibuat</span>
                </div>
                <p className="font-medium pl-6">
                  {formatDate(dataMaterial.createdAt)}
                </p>
              </div>

              {dataMaterial.updatedAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Terakhir Diperbarui</span>
                  </div>
                  <p className="font-medium pl-6">
                    {formatDate(dataMaterial.updatedAt)}
                  </p>
                </div>
              )}

              {/* Stock Value Estimation */}
              {dataMaterial.lastPurchasePrice && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Estimasi Nilai Stok</span>
                  </div>
                  <p className="font-medium pl-6">
                    {formatCurrency(
                      dataMaterial.goodStock *
                        dataMaterial.lastPurchasePrice.toNumber()
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detail Material
          </DialogTitle>
          <DialogDescription>
            {dataMaterial
              ? `Informasi lengkap mengenai material ${dataMaterial.name}`
              : "Memuat informasi material..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
