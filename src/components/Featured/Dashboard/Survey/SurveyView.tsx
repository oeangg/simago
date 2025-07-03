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
  FileText,
  MapPin,
  User,
  Truck,
  Ship,
  Plane,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
  Ruler,
  Hash,
  Box,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { trpc } from "@/app/_trpcClient/client";
import { CargoType, ShipmentDetail, SurveyStatus } from "@prisma/client";

interface ViewSurveyProps {
  surveyId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Helper functions
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMMM yyyy", { locale: localeId });
};

const formatCBM = (value: number) => {
  return `${value.toFixed(4)} m³`;
};

const getStatusConfig = (status: SurveyStatus) => {
  const configs = {
    ONPROGRESS: {
      label: "On Progress",
      icon: Clock,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    APPROVED: {
      label: "Approved",
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    REJECT: {
      label: "Rejected",
      icon: XCircle,
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };
  return configs[status];
};

const getCargoTypeConfig = (cargoType: CargoType) => {
  const configs = {
    FULL_TRUCK: { label: "Full Truck", icon: Truck },
    FCL: { label: "FCL (Full Container Load)", icon: Package },
    LCL: { label: "LCL (Less Container Load)", icon: Box },
  };
  return configs[cargoType];
};

const getShipmentDetailConfig = (detail: ShipmentDetail) => {
  const configs = {
    SEA: { label: "Sea Freight", icon: Ship, color: "text-blue-600" },
    DOM: { label: "Domestic", icon: Truck, color: "text-green-600" },
    AIR: { label: "Air Freight", icon: Plane, color: "text-sky-600" },
  };
  return configs[detail];
};

export default function ViewSurvey({
  surveyId,
  open,
  onOpenChange,
}: ViewSurveyProps) {
  const {
    data: dataSurvey,
    isLoading,
    error,
    refetch,
  } = trpc.survey.getSurveyById.useQuery(
    { id: surveyId },
    {
      enabled: !!open && !!surveyId,
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
              Memuat data survey...
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
              {error.message || "Terjadi kesalahan saat memuat data survey"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!dataSurvey) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Tidak Ditemukan</h3>
            <p className="text-muted-foreground text-sm">
              Data survey dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    const statusConfig = getStatusConfig(dataSurvey.statusSurvey);
    const cargoConfig = getCargoTypeConfig(dataSurvey.cargoType);
    const shipmentConfig = getShipmentDetailConfig(dataSurvey.shipmentDetail);
    const StatusIcon = statusConfig.icon;
    const CargoIcon = cargoConfig.icon;
    const ShipmentIcon = shipmentConfig.icon;

    // Calculate totals
    const totalItems = dataSurvey.surveyItems.length;
    const totalQuantity = dataSurvey.surveyItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalCBM = dataSurvey.surveyItems.reduce(
      (sum, item) => sum + item.cbm,
      0
    );

    return (
      <div className="space-y-6">
        {/* Survey Header */}
        <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                  <FileText className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Survey Cargo
                    </h2>
                    <p className="text-lg text-gray-600 font-mono font-semibold">
                      {dataSurvey.surveyNo}
                    </p>
                  </div>
                  <Badge className={statusConfig.className}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Tanggal Survey</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(dataSurvey.surveyDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Tanggal Pekerjaan</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(dataSurvey.workDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gray-100">
                  <Building2 className="h-6 w-6 text-gray-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {dataSurvey.customers.name}
                </h3>
                <p className="text-muted-foreground">
                  Kode: {dataSurvey.customers.code}
                </p>

                {/* Primary Contact Info (if available) */}
                {dataSurvey.customers.contacts &&
                  dataSurvey.customers.contacts.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <h4 className="font-medium text-sm">Primary Contact:</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {dataSurvey.customers.contacts[0].name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {dataSurvey.customers.contacts[0].phoneNumber}
                        </div>
                        {dataSurvey.customers.contacts[0].email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {dataSurvey.customers.contacts[0].email}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Rute Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Asal</p>
                  <p className="text-lg font-semibold">{dataSurvey.origin}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ShipmentIcon className={`h-6 w-6 ${shipmentConfig.color}`} />
                  <div className="text-right">
                    <p className="text-sm font-medium">Tujuan</p>
                    <p className="text-lg font-semibold">
                      {dataSurvey.destination}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Jenis Pengiriman:
                  </span>
                  <span className="font-medium">{dataSurvey.shipmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Detail Pengiriman:
                  </span>
                  <span className="font-medium">{shipmentConfig.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CargoIcon className="h-5 w-5" />
                Informasi Muatan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CargoIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{cargoConfig.label}</h3>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {totalItems}
                  </p>
                  <p className="text-sm text-muted-foreground">Jenis Barang</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {totalQuantity}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pieces</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCBM(totalCBM)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Survey Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Barang Survey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-center">Dimensi (cm)</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">CBM</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSurvey.surveyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Ruler className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {item.width} × {item.length} × {item.height}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {formatCBM(item.cbm)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.note || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary Row */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Keseluruhan:</span>
                <div className="flex items-center gap-6 text-sm">
                  <span>
                    <strong>{totalItems}</strong> jenis barang
                  </span>
                  <span>
                    <strong>{totalQuantity}</strong> pieces
                  </span>
                  <Badge className="bg-primary text-primary-foreground font-mono">
                    {formatCBM(totalCBM)}
                  </Badge>
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Survey Cargo
          </DialogTitle>
          <DialogDescription>
            {dataSurvey
              ? `Informasi lengkap Survey ${dataSurvey.surveyNo}`
              : "Memuat informasi survey..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
