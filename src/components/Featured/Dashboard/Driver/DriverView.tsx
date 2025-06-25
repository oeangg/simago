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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  Building,
  Loader2,
  AlertCircle,
  Phone,
  Calendar,
  IdCard,
  MapIcon,
  Clock,
  FileText,
  Mars,
  Venus,
  Truck,
} from "lucide-react";

import { trpc } from "@/app/_trpcClient/client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Gender } from "@prisma/client";

interface ViewDriverProps {
  driverId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ViewDriver({
  driverId,
  open,
  onOpenChange,
}: ViewDriverProps) {
  const {
    data: dataDriver,
    isLoading,
    error,
    refetch,
  } = trpc.Driver.getDriverById.useQuery(
    { id: driverId },
    {
      enabled: open, // Only fetch when dialog is open
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // Helper functions
  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: id });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const getStatusBadge = (status: boolean) => {
    const config = {
      variant: status ? ("default" as const) : ("destructive" as const),
      label: status ? "Aktif" : "Tidak Aktif",
      className: status ? "bg-green-500 hover:bg-green-600 text-white" : "",
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            status ? "bg-white" : "bg-red-100"
          }`}
        />
        {config.label}
      </Badge>
    );
  };

  const getGenderDisplay = (gender: Gender) => {
    if (gender === "MALE") {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <Mars className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">Laki-laki</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-pink-50 border-pink-200 text-pink-700">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <Venus className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium">Perempuan</span>
        </div>
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatAddress = (
    addressLine1: string,
    addressLine2?: string | null,
    city?: string
  ) => {
    const parts = [addressLine1, addressLine2, city].filter(Boolean);
    return parts.join(", ");
  };

  const renderDialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Memuat data driver...
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
              {error.message || "Terjadi kesalahan saat memuat data driver"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!dataDriver) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Driver Tidak Ditemukan
            </h3>
            <p className="text-muted-foreground text-sm">
              Data driver dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Driver Header */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                  {getInitials(dataDriver.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {dataDriver.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <IdCard className="w-4 h-4" />
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {dataDriver.code}
                      </span>
                    </div>
                    {getGenderDisplay(dataDriver.gender)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(dataDriver.statusActive)}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Tanggal Aktif: {formatDate(dataDriver.activeDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Driver Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Informasi Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kode Driver:</span>
                  <Badge variant="outline" className="font-mono font-medium">
                    {dataDriver.code}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nama Lengkap:</span>
                  <span className="text-sm font-medium">{dataDriver.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Jenis Kelamin:</span>
                  {getGenderDisplay(dataDriver.gender)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(dataDriver.statusActive)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tanggal Aktif:</span>
                  <span className="text-sm font-medium">
                    {formatDate(dataDriver.activeDate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nomor Telepon</p>
                  <p className="font-mono font-medium">
                    {dataDriver.phoneNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Informasi Alamat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Kota
                  </span>
                </div>
                <p className="text-lg font-semibold">{dataDriver.city}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Alamat Baris 1
                  </span>
                </div>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {dataDriver.addressLine1}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Alamat Baris 2
                  </span>
                </div>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {dataDriver.addressLine2 || "-"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">
                  Alamat Lengkap
                </span>
              </div>
              <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                {formatAddress(
                  dataDriver.addressLine1,
                  dataDriver.addressLine2,
                  dataDriver.city
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Informasi Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  ID Driver:
                </span>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {dataDriver.id}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Status Terakhir Update:
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600">
                    {dataDriver.statusActive
                      ? "Driver Aktif"
                      : "Driver Tidak Aktif"}
                  </span>
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Detail Driver
          </DialogTitle>
          <DialogDescription>
            {dataDriver
              ? `Informasi lengkap mengenai driver ${dataDriver.name}`
              : "Memuat informasi driver..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
