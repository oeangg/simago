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
  Building2,
  MapIcon,
  ScrollText,
  CreditCard,
  Star,
  Users,
  Home,
} from "lucide-react";
import { AddressType, ContactType, StatusActive } from "@prisma/client";
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

  const getStatusBadge = (status: StatusActive) => {
    const configs = {
      [StatusActive.ACTIVE]: {
        variant: "default" as const,
        label: "Aktif",
        className: "bg-green-500 hover:bg-green-600 text-white",
        icon: "🟢",
      },
      [StatusActive.NOACTIVE]: {
        variant: "destructive" as const,
        label: "Tidak Aktif",
        className: "bg-red-500 hover:bg-red-600 text-white",
        icon: "🔴",
      },
      [StatusActive.SUSPENDED]: {
        variant: "secondary" as const,
        label: "Ditangguhkan",
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
        icon: "🟡",
      },
    };

    const config = configs[status] || configs[StatusActive.NOACTIVE];

    return (
      <Badge variant={config.variant} className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const getAddressTypeInfo = (type: AddressType) => {
    const types = {
      [AddressType.BILLING]: {
        label: "Penagihan",
        icon: CreditCard,
        color: "text-blue-600 bg-blue-50",
      },
      [AddressType.BRANCH]: {
        label: "Cabang",
        icon: Building2,
        color: "text-purple-600 bg-purple-50",
      },
      [AddressType.HEAD_OFFICE]: {
        label: "Kantor Utama",
        icon: Building,
        color: "text-green-600 bg-green-50",
      },
      [AddressType.SHIPPING]: {
        label: "Pengiriman",
        icon: MapPin,
        color: "text-orange-600 bg-orange-50",
      },
      [AddressType.WAREHOUSE]: {
        label: "Gudang",
        icon: Home,
        color: "text-indigo-600 bg-indigo-50",
      },
    };
    return (
      types[type] || {
        label: type,
        icon: MapPin,
        color: "text-gray-600 bg-gray-50",
      }
    );
  };

  const getContactTypeInfo = (type: ContactType) => {
    const types = {
      [ContactType.BILLING]: {
        label: "Penagihan",
        icon: CreditCard,
        color: "text-blue-600 bg-blue-50",
      },
      [ContactType.EMERGENCY]: {
        label: "Darurat",
        icon: AlertCircle,
        color: "text-red-600 bg-red-50",
      },
      [ContactType.PRIMARY]: {
        label: "Utama",
        icon: Star,
        color: "text-yellow-600 bg-yellow-50",
      },
      [ContactType.SHIPPING]: {
        label: "Pengiriman",
        icon: MapPin,
        color: "text-orange-600 bg-orange-50",
      },
      [ContactType.TECHNICAL]: {
        label: "Teknikal",
        icon: FileText,
        color: "text-purple-600 bg-purple-50",
      },
    };
    return (
      types[type] || {
        label: type,
        icon: User,
        color: "text-gray-600 bg-gray-50",
      }
    );
  };

  const formatAddress = (address: {
    addressLine1: string;
    addressLine2?: string | null;
    zipcode?: string | null;
  }) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.zipcode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
              {error.message || "Terjadi kesalahan saat memuat data customer"}
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
        {/* Customer Header */}
        <Card className="border-2 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                  {getInitials(dataCustomer.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {dataCustomer.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash className="w-4 h-4" />
                      <span className="font-mono bg-white px-2 py-1 rounded border">
                        {dataCustomer.code}
                      </span>
                    </div>
                    {getStatusBadge(dataCustomer.statusActive)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Tanggal Aktif: {formatDate(dataCustomer.activeDate)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Informasi Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kode Customer:</span>
                  <Badge variant="outline" className="font-mono font-medium">
                    {dataCustomer.code}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Nama Perusahaan:
                  </span>
                  <span className="text-sm font-medium">
                    {dataCustomer.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(dataCustomer.statusActive)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tanggal Aktif:</span>
                  <span className="text-sm font-medium">
                    {formatDate(dataCustomer.activeDate)}
                  </span>
                </div>
              </div>

              {dataCustomer.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ScrollText className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-blue-900">
                        Catatan:
                      </span>
                      <p className="text-sm text-blue-700 mt-1">
                        {dataCustomer.notes}
                      </p>
                    </div>
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
                  <User className="h-5 w-5 text-green-600" />
                  Kontak Utama
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{primaryContact.name}</p>
                    <p className="text-sm text-gray-600">
                      {getContactTypeInfo(primaryContact.contactType).label}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono">
                      {primaryContact.phoneNumber}
                    </span>
                  </div>
                  {primaryContact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{primaryContact.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* NPWP Information */}
        {(dataCustomer.npwpNumber ||
          dataCustomer.npwpName ||
          dataCustomer.npwpAddress) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Informasi NPWP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataCustomer.npwpNumber && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Nomor NPWP:
                    </span>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded border">
                      {dataCustomer.npwpNumber}
                    </p>
                  </div>
                )}
                {dataCustomer.npwpName && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Nama NPWP:
                    </span>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {dataCustomer.npwpName}
                    </p>
                  </div>
                )}
                {dataCustomer.npwpDate && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Tanggal NPWP:
                    </span>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {formatDate(dataCustomer.npwpDate)}
                    </p>
                  </div>
                )}
              </div>
              {dataCustomer.npwpAddress && (
                <div className="mt-4 space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Alamat NPWP:
                  </span>
                  <p className="text-sm bg-gray-50 p-3 rounded border leading-relaxed">
                    {dataCustomer.npwpAddress}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Primary Address */}
        {primaryAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Alamat Utama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    getAddressTypeInfo(primaryAddress.addressType).color
                  }`}
                >
                  {(() => {
                    const IconComponent = getAddressTypeInfo(
                      primaryAddress.addressType
                    ).icon;
                    return <IconComponent className="w-5 h-5" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">
                      {getAddressTypeInfo(primaryAddress.addressType).label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Alamat Utama
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {formatAddress(primaryAddress)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Addresses */}
        {dataCustomer.addresses && dataCustomer.addresses.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-orange-600" />
                Semua Alamat ({dataCustomer.addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dataCustomer.addresses.map((address) => {
                const addressInfo = getAddressTypeInfo(address.addressType);
                return (
                  <div
                    key={address.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${addressInfo.color}`}
                      >
                        {(() => {
                          const IconComponent = addressInfo.icon;
                          return <IconComponent className="w-4 h-4" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {addressInfo.label}
                          </Badge>
                          {address.isPrimaryAddress && (
                            <Badge variant="default" className="text-xs">
                              Utama
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {formatAddress(address)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* All Contacts */}
        {dataCustomer.contacts && dataCustomer.contacts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Semua Kontak ({dataCustomer.contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dataCustomer.contacts.map((contact) => {
                const contactInfo = getContactTypeInfo(contact.contactType);
                return (
                  <div
                    key={contact.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${contactInfo.color}`}
                      >
                        {(() => {
                          const IconComponent = contactInfo.icon;
                          return <IconComponent className="w-4 h-4" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {contactInfo.label}
                          </Badge>
                          {contact.isPrimaryContact && (
                            <Badge variant="default" className="text-xs">
                              Utama
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{contact.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phoneNumber}
                            </div>
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Detail Customer
          </DialogTitle>
          <DialogDescription>
            {dataCustomer
              ? `Informasi lengkap mengenai Customer ${dataCustomer.name}`
              : "Memuat informasi customer..."}
          </DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
