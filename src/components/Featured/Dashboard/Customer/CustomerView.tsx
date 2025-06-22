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
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  Hash,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  AddressType,
  ContactType,
  CustomerType,
  StatusActive,
} from "@prisma/client";
import { trpc } from "@/app/_trpcClient/client";

import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ViewCustomerProps {
  customerId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ViewCustomer({
  customerId,
  open,
  onOpenChange,
}: ViewCustomerProps) {
  const {
    data: dataCustomer,
    isLoading,
    error,
    refetch,
  } = trpc.Customer.getCustomer.useQuery(
    { id: customerId },
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

  const getStatusColor = (status: StatusActive) => {
    switch (status) {
      case StatusActive.ACTIVE:
        return "bg-green-200 text-green-800 border-green-200 hover:bg-green-300";
      case StatusActive.NOACTIVE:
        return "bg-red-300 text-red-800 border-red-200 hover:bg-red-400";
      case StatusActive.SUSPENDED:
        return "bg-yellow-200 text-yellow-800 border-yellow-200 hover:bg-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: StatusActive) => {
    switch (status) {
      case StatusActive.ACTIVE:
        return "Aktif";
      case StatusActive.NOACTIVE:
        return "Tidak Aktif";
      case StatusActive.SUSPENDED:
        return "Ditangguhkan";
      default:
        return status;
    }
  };

  const getCustomerTypeLabel = (type: CustomerType) => {
    switch (type) {
      case CustomerType.DOMESTIC:
        return "Domestic";
      case CustomerType.INTERNATIONAL:
        return "International";
      default:
        return type;
    }
  };

  const getAddressTypeLabel = (type: AddressType) => {
    switch (type) {
      case AddressType.BILLING:
        return "Penagihan";
      case AddressType.BRANCH:
        return "Cabang";
      case AddressType.HEAD_OFFICE:
        return "Kantor Utama";
      case AddressType.SHIPPING:
        return "Pengiriman";
      case AddressType.WAREHOUSE:
        return "Gudang";
      default:
        return type;
    }
  };

  const getContactTypeLabel = (type: ContactType) => {
    switch (type) {
      case ContactType.BILLING:
        return "Penagihan";
      case ContactType.EMERGENCY:
        return "Darurat";
      case ContactType.PRIMARY:
        return "Utama";
      case ContactType.SHIPPING:
        return "Pengiriman";
      case ContactType.TECHNICAL:
        return "Teknikal";
      default:
        return type;
    }
  };

  const formatAddress = (address: {
    addressLine1: string;
    addressLine2?: string | null;
    zipcode?: string | null;
    district?: { name: string } | null;
    regency?: { name: string } | null;
    province?: { name: string } | null;
    country?: { name: string } | null;
  }) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.district?.name,
      address.regency?.name,
      address.province?.name,
      address.country?.name,
      address.zipcode,
    ].filter(Boolean);

    return parts.join(", ");
  };

  // Find primary address and contact
  const primaryAddress = dataCustomer?.addresses?.find(
    (addr) => addr.isPrimaryAddress
  );
  const primaryContact = dataCustomer?.contacts?.find(
    (contact) => contact.isPrimaryContact
  );

  const renderDialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Memuat data Customer...
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
              {error.message || "Terjadi kesalahan saat memuat data supplier"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </Card>
        </div>
      );
    }

    if (!dataCustomer) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-6 text-center max-w-md">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Customer Tidak Ditemukan
            </h3>
            <p className="text-muted-foreground text-sm">
              Data Customer dengan ID tersebut tidak dapat ditemukan.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">{dataCustomer.name}</h3>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-muted-foreground">
                Kode: {dataCustomer.code}
              </p>
              {dataCustomer.id && (
                <p className="text-sm text-muted-foreground">
                  ID: {dataCustomer.id}
                </p>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(dataCustomer.statusActive)}>
            {getStatusLabel(dataCustomer.statusActive)}
          </Badge>
        </div>

        <Separator />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Tipe Customer</p>
                <p className="text-sm text-muted-foreground">
                  {getCustomerTypeLabel(dataCustomer.customerType)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tanggal Aktif</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(dataCustomer.activeDate)}
                  </p>
                </div>
              </div>
            </div>

            {dataCustomer.npwpNumber && (
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">NPWP</p>
                  <p className="text-sm text-muted-foreground">
                    {dataCustomer.npwpNumber}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Primary Contact */}
        {primaryContact && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Kontak Utama
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nama</p>
                  <p className="text-sm text-muted-foreground">
                    {primaryContact.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipe Kontak</p>
                  <p className="text-sm text-muted-foreground">
                    {getContactTypeLabel(primaryContact.contactType)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telepon</p>
                    <p className="text-sm text-muted-foreground">
                      {primaryContact.phoneNumber}
                    </p>
                  </div>
                </div>
                {primaryContact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {primaryContact.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Address */}
        {primaryAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Alamat Utama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getAddressTypeLabel(primaryAddress.addressType)}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">
                  {formatAddress(primaryAddress)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Addresses */}
        {dataCustomer.addresses && dataCustomer.addresses.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Semua Alamat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataCustomer.addresses.map((address) => (
                <div
                  key={address.id}
                  className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        address.isPrimaryAddress ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {getAddressTypeLabel(address.addressType)}
                    </Badge>
                    {address.isPrimaryAddress && (
                      <Badge variant="outline" className="text-xs">
                        Utama
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {formatAddress(address)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Contacts */}
        {dataCustomer.contacts && dataCustomer.contacts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Semua Kontak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataCustomer.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant={
                        contact.isPrimaryContact ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {getContactTypeLabel(contact.contactType)}
                    </Badge>
                    {contact.isPrimaryContact && (
                      <Badge variant="outline" className="text-xs">
                        Utama
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-foreground">
                        Nama:{" "}
                      </span>
                      <span className="text-muted-foreground">
                        {contact.name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Telepon:{" "}
                      </span>
                      <span className="text-muted-foreground">
                        {contact.phoneNumber}
                      </span>
                    </div>
                    {contact.email && (
                      <div>
                        <span className="font-medium text-foreground">
                          Email:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {contact.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Detail Supplier
          </DialogTitle>
          <DialogDescription>
            {dataCustomer
              ? `Informasi lengkap mengenai Customer ${dataCustomer.name}`
              : "Memuat informasi supplier..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
