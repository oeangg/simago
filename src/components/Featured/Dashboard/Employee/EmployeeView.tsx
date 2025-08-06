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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Building,
  Loader2,
  AlertCircle,
  User,
  Phone,
  Calendar,
  Briefcase,
  Mail,
  IdCard,
  MapIcon,
  Clock,
  FileText,
  Mars,
  Venus,
  Building2,
} from "lucide-react";

import { trpc } from "@/app/_trpcClient/client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Gender } from "@prisma/client";
import { getInitials } from "@/tools/getInitials";

interface ViewEmployeeProps {
  employeeId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ViewEmployee({
  employeeId,
  open,
  onOpenChange,
}: ViewEmployeeProps) {
  const {
    data: dataEmployee,
    isLoading,
    error,
    refetch,
  } = trpc.Employee.getEmployeebyId.useQuery(
    { id: employeeId },
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
          <span className="text-sm font-medium">Pria</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-pink-50 border-pink-200 text-pink-700">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <Venus className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium">Wanita</span>
        </div>
      );
    }
  };

  const getDivisionBadge = (divisionName: string) => {
    const upperDiv = divisionName.toUpperCase();
    let colorClass = "bg-gray-500 text-white";

    switch (upperDiv) {
      case "MARKETING":
        colorClass = "bg-blue-500 text-white";
        break;
      case "IT":
        colorClass = "bg-purple-500 text-white";
        break;
      case "FINANCE":
        colorClass = "bg-green-500 text-white";
        break;
      case "HR":
        colorClass = "bg-orange-500 text-white";
        break;
      case "OPERATIONS":
        colorClass = "bg-indigo-500 text-white";
        break;
    }

    return (
      <Badge className={colorClass}>
        <Building2 className="w-3 h-3 mr-1" />
        {divisionName}
      </Badge>
    );
  };

  const renderDialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Memuat data karyawan...
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
              {error.message || "Terjadi kesalahan saat memuat data karyawan"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!dataEmployee) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Karyawan Tidak Ditemukan
            </h3>
            <p className="text-muted-foreground text-sm">
              Data karyawan dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    const latestEmployment = dataEmployee.employments?.[0];

    return (
      <div className="space-y-6">
        {/* Employee Header */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={dataEmployee.photo || undefined}
                  alt={dataEmployee.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                  {getInitials(dataEmployee.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {dataEmployee.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <IdCard className="w-4 h-4" />
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {dataEmployee.nik}
                      </span>
                    </div>
                    {getGenderDisplay(dataEmployee.gender)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(dataEmployee.isActive)}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Bergabung: {formatDate(dataEmployee.activeDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employment Information */}
          {latestEmployment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Informasi Pekerjaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jabatan:</span>
                    <Badge variant="outline" className="font-medium">
                      {latestEmployment.position.name}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Divisi:</span>
                    {getDivisionBadge(latestEmployment.division.name)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Mulai Bekerja:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(latestEmployment.startDate)}
                    </span>
                  </div>

                  {latestEmployment.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Selesai Bekerja:
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(latestEmployment.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    {dataEmployee.phoneNumber}
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
                <p className="text-lg font-semibold">{dataEmployee.city}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Kode Pos
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {dataEmployee.zipcode || "-"}
                </p>
              </div>

              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Alamat Lengkap
                  </span>
                </div>
                <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {dataEmployee.address}
                </p>
              </div>
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
                  Foto Profil:
                </span>
                <p className="text-sm text-gray-600">
                  {dataEmployee.photo ? "Tersedia" : "Tidak tersedia"}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Tanda Tangan Digital:
                </span>
                <p className="text-sm text-gray-600">
                  {dataEmployee.ttdDigital ? "Tersedia" : "Tidak tersedia"}
                </p>
              </div>

              {dataEmployee.resignDate && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Tanggal Resign:
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {formatDate(dataEmployee.resignDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employment History */}
        {dataEmployee.employments && dataEmployee.employments.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Riwayat Pekerjaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataEmployee.employments.map((employment, index) => (
                  <div
                    key={employment.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-indigo-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {employment.position.name}
                        </Badge>
                        {getDivisionBadge(employment.division.name)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(employment.startDate)}
                        </div>
                        {employment.endDate && (
                          <>
                            <span>-</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(employment.endDate)}
                            </div>
                          </>
                        )}
                        {!employment.endDate && (
                          <Badge variant="secondary" className="text-xs">
                            Saat ini
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detail Karyawan
          </DialogTitle>
          <DialogDescription>
            {dataEmployee
              ? `Informasi lengkap mengenai karyawan ${dataEmployee.name}`
              : "Memuat informasi karyawan..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
