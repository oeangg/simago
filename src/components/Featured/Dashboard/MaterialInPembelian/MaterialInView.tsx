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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Loader2,
  AlertCircle,
  Package,
  Building2,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  Truck,
  CheckCircle,
  XCircle,
  Info,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { trpc } from "@/app/_trpcClient/client";
import { StockType } from "@prisma/client";

interface ViewMaterialInProps {
  materialInId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Helper functions
const formatCurrency = (value: number | null | undefined) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMMM yyyy", { locale: localeId });
};

const getStockTypeBadge = (stockType: StockType) => {
  if (stockType === "BAD") {
    return (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="w-3 h-3 mr-1" />
        Bad Stock
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="text-xs bg-green-600">
      <CheckCircle className="w-3 h-3 mr-1" />
      Good Stock
    </Badge>
  );
};

export default function ViewMaterialIn({
  materialInId,
  open,
  onOpenChange,
}: ViewMaterialInProps) {
  const {
    data: materialIn,
    isLoading,
    error,
    refetch,
  } = trpc.MaterialIn.getMaterialInById.useQuery(
    { id: materialInId },
    {
      enabled: !!open && !!materialInId,
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
              Memuat data pembelian...
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
              {error.message || "Terjadi kesalahan saat memuat data pembelian"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!materialIn) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Tidak Ditemukan</h3>
            <p className="text-muted-foreground text-sm">
              Data pembelian dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    const totalItems = materialIn.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const hasGoodStock = materialIn.items.some(
      (item) => item.stockType === "GOOD"
    );
    const hasBadStock = materialIn.items.some(
      (item) => item.stockType === "BAD"
    );

    return (
      <div className="space-y-6">
        {/* Transaction Header */}
        <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                  <ShoppingCart className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Pembelian Material
                    </h2>
                    <p className="text-sm text-gray-600 font-mono">
                      {materialIn.transactionNo}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(materialIn.transactionDate)}
                    </Badge>
                    {materialIn.invoiceNo && (
                      <Badge variant="secondary" className="gap-1">
                        <Receipt className="h-3 w-3" />
                        {materialIn.invoiceNo}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/50 p-3 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="font-semibold">{materialIn.supplierName}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detail Material ({materialIn.items.length} Item)
              </div>
              <div className="flex gap-2">
                {hasGoodStock && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Good Stock
                  </Badge>
                )}
                {hasBadStock && (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Bad Stock
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead>Stock Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Harga/Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialIn.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        Item #{index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.material.name}
                      </TableCell>
                      <TableCell>{getStockTypeBadge(item.stockType)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        {item.notes || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ringkasan Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(materialIn.totalAmountBeforeTax)}
                    </span>
                  </div>

                  {materialIn.totalTax !== null && materialIn.totalTax > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Pajak
                      </span>
                      <span className="font-medium">
                        {formatCurrency(materialIn.totalTax)}
                      </span>
                    </div>
                  )}

                  {materialIn.otherCosts !== null &&
                    materialIn.otherCosts > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Biaya Lain
                        </span>
                        <span className="font-medium">
                          {formatCurrency(materialIn.otherCosts)}
                        </span>
                      </div>
                    )}

                  <Separator />

                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-semibold">
                      Total Pembayaran
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(materialIn.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Informasi Tambahan
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Item</span>
                      <span className="font-medium">
                        {materialIn.items.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Quantity</span>
                      <span className="font-medium">
                        {formatNumber(totalItems)}
                      </span>
                    </div>
                    {materialIn.notes && (
                      <div className="pt-2">
                        <p className="text-gray-600 mb-1">Catatan:</p>
                        <p className="text-gray-800 bg-white p-2 rounded">
                          {materialIn.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Pembelian Material
          </DialogTitle>
          <DialogDescription>
            {materialIn
              ? `Informasi lengkap transaksi ${materialIn.transactionNo}`
              : "Memuat informasi pembelian..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
