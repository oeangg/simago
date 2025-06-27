"use client";

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
import {
  Loader2,
  AlertCircle,
  Calendar,
  Car,
  Hash,
  Wrench,
  Truck,
  Info,
} from "lucide-react";

import { trpc } from "@/app/_trpcClient/client";
import { VehicleType } from "@prisma/client";

interface ViewVehicleProps {
  vehicleId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ViewVehicle({
  vehicleId,
  open,
  onOpenChange,
}: ViewVehicleProps) {
  const {
    data: dataVehicle,
    isLoading,
    error,
    refetch,
  } = trpc.Vehicle.getVehicleById.useQuery(
    { id: vehicleId },
    {
      enabled: open, // Only fetch when dialog is open
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  const vehicleTypeOptions = [
    { value: "BOX", label: "Box", color: "bg-blue-100 text-blue-800" },
    { value: "TRUCK", label: "Truck", color: "bg-green-100 text-green-800" },
    {
      value: "WINGBOX",
      label: "Wing Box",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "TRONTON",
      label: "Tronton",
      color: "bg-orange-100 text-orange-800",
    },
    { value: "TRAILER", label: "Trailer", color: "bg-red-100 text-red-800" },
    {
      value: "PICKUP",
      label: "Pickup",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "VAN", label: "Van", color: "bg-indigo-100 text-indigo-800" },
  ];

  const getVehicleTypeConfig = (type: VehicleType) => {
    const config = vehicleTypeOptions.find((option) => option.value === type);
    if (!config) {
      return { label: type, color: "bg-gray-100 text-gray-800" };
    }
    return config;
  };

  const renderDialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Memuat data kendaraan...
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
              {error.message || "Terjadi kesalahan saat memuat data kendaraan"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!dataVehicle) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Kendaraan Tidak Ditemukan
            </h3>
            <p className="text-muted-foreground text-sm">
              Data kendaraan dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    const vehicleTypeConfig = getVehicleTypeConfig(dataVehicle.vehicleType);

    return (
      <div className="space-y-6">
        {/* Vehicle Header */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Car className="h-10 w-10 text-white" />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {dataVehicle.vehicleNumber}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={`${vehicleTypeConfig.color} border-0`}>
                      {vehicleTypeConfig.label}
                    </Badge>
                    {dataVehicle.vehicleMake && (
                      <span className="text-sm text-gray-600">
                        {dataVehicle.vehicleMake}
                      </span>
                    )}
                    {dataVehicle.vehicleYear && (
                      <Badge variant="outline">{dataVehicle.vehicleYear}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                Informasi Kendaraan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Nomor Kendaraan:
                  </span>
                  <Badge variant="outline" className="font-mono font-medium">
                    {dataVehicle.vehicleNumber}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Tipe Kendaraan:
                  </span>
                  <Badge className={`${vehicleTypeConfig.color} border-0`}>
                    {vehicleTypeConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Merek:
                  </span>
                  <span className="text-sm font-medium">
                    {dataVehicle.vehicleMake || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tahun:
                  </span>
                  <span className="text-sm font-medium">
                    {dataVehicle.vehicleYear || "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-green-600" />
                Detail Spesifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Tipe Kendaraan</p>
                  <p className="font-semibold">{vehicleTypeConfig.label}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Merek</p>
                  <p className="font-semibold">
                    {dataVehicle.vehicleMake || "Tidak Diketahui"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Tahun Pembuatan</p>
                  <p className="font-semibold">
                    {dataVehicle.vehicleYear || "Tidak Diketahui"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Aktif
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-600" />
              Informasi Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  ID Kendaraan:
                </span>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {dataVehicle.id}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Informasi Lengkap:
                </span>
                <div className="text-sm bg-gray-50 p-3 rounded-lg space-y-1">
                  <p>
                    <span className="font-medium">Nomor:</span>{" "}
                    {dataVehicle.vehicleNumber}
                  </p>
                  <p>
                    <span className="font-medium">Tipe:</span>{" "}
                    {vehicleTypeConfig.label}
                  </p>
                  {dataVehicle.vehicleMake && (
                    <p>
                      <span className="font-medium">Merek:</span>{" "}
                      {dataVehicle.vehicleMake}
                    </p>
                  )}
                  {dataVehicle.vehicleYear && (
                    <p>
                      <span className="font-medium">Tahun:</span>{" "}
                      {dataVehicle.vehicleYear}
                    </p>
                  )}
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
            <Car className="h-5 w-5" />
            Detail Kendaraan
          </DialogTitle>
          <DialogDescription>
            {dataVehicle
              ? `Informasi lengkap mengenai kendaraan ${dataVehicle.vehicleNumber}`
              : "Memuat informasi kendaraan..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
