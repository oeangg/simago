"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  Globe,
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  AddressType,
  ContactType,
  StatusActive,
  SupplierType,
} from "@prisma/client";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";

interface SupplierAddress {
  id: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2?: string | null;
  zipcode?: string | null;
  isPrimaryAddress: boolean;
  country?: {
    name: string;
  } | null;
  province?: {
    name: string;
  } | null;
  regency?: {
    name: string;
  } | null;
  district?: {
    name: string;
  } | null;
}

interface SupplierContact {
  id: string;
  contactType: ContactType;
  name: string;
  phoneNumber: string;
  email?: string | null;
  isPrimaryContact: boolean;
}

export interface SupplierColumnsProps {
  id?: string;
  code: string;
  name: string;
  supplierType: SupplierType;
  statusActive: StatusActive;
  activeDate?: Date;
  npwpNumber?: string | null;
  addresses: SupplierAddress[];
  contacts: SupplierContact[];
}

interface ColumnActions {
  onView: (supplier: SupplierColumnsProps) => void;
  onEdit: (supplier: SupplierColumnsProps) => void;
  onDelete: (supplier: SupplierColumnsProps) => void;
}

// Helper functions
const getAddressTypeLabel = (type: AddressType): string => {
  const labels: Record<AddressType, string> = {
    HEAD_OFFICE: "Kantor Pusat",
    BRANCH: "Cabang",
    WAREHOUSE: "Gudang",
    BILLING: "Penagihan",
    SHIPPING: "Pengiriman",
  };
  return labels[type] || type;
};

const getContactTypeLabel = (type: ContactType): string => {
  const labels: Record<ContactType, string> = {
    PRIMARY: "Utama",
    BILLING: "Penagihan",
    SHIPPING: "Pengiriman",
    EMERGENCY: "Darurat",
    TECHNICAL: "Teknis",
  };
  return labels[type] || type;
};

const getStatusBadge = (status: StatusActive) => {
  const variants = {
    ACTIVE: {
      variant: "default" as const,
      label: "Aktif",
      className: "bg-green-500 hover:bg-green-600",
    },
    NOACTIVE: {
      variant: "destructive" as const,
      label: "Tidak Aktif",
      className: "",
    },
    SUSPENDED: {
      variant: "secondary" as const,
      label: "Ditangguhkan",
      className: "bg-yellow-500",
    },
  };

  const config = variants[status] || variants.NOACTIVE;

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

export const supplierColumns = (
  actions: ColumnActions
): ColumnDef<SupplierColumnsProps>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "code",
    header: ({ column }) => {
      return <DataTableColumnHeaderSort column={column} title="Kode" />;
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue("code")}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Nama Supplier" />
      );
    },
    cell: ({ row }) => {
      const supplier = row.original;
      const primaryAddress = row.original.addresses.find(
        (addr) => addr.isPrimaryAddress
      );

      if (!primaryAddress) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }

      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          {primaryAddress.country?.name === "INDONESIA" ? (
            <Home className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />
          )}
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{supplier.name}</span>
            <span className="text-xs text-muted-foreground">
              {primaryAddress.country?.name}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "supplierType",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.getValue("supplierType") as SupplierType;
      return (
        <Badge variant={type === "LOGISTIC" ? "default" : "secondary"}>
          {type === "LOGISTIC" ? "Logistic" : "Services"}
        </Badge>
      );
    },
  },
  {
    id: "primaryAddress",
    header: "Alamat Utama",
    cell: ({ row }) => {
      const primaryAddress = row.original.addresses.find(
        (addr) => addr.isPrimaryAddress
      );

      if (!primaryAddress) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }

      const locationParts = [
        primaryAddress.district?.name,
        primaryAddress.regency?.name,
        primaryAddress.province?.name,
      ].filter(Boolean);

      return (
        <div className="flex items-start gap-2 max-w-[200px]">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {getAddressTypeLabel(primaryAddress.addressType)}
              </Badge>
            </div>
            <p className="line-clamp-1 font-medium">
              {primaryAddress.addressLine1}
            </p>
            {primaryAddress.addressLine2 && (
              <p className="line-clamp-1 text-muted-foreground text-xs">
                {primaryAddress.addressLine2}
              </p>
            )}
            {locationParts.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {locationParts.join(", ")}
              </p>
            )}
            {primaryAddress.zipcode && (
              <p className="text-muted-foreground text-xs">
                {primaryAddress.zipcode}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "primaryContact",
    header: "Kontak Utama",
    cell: ({ row }) => {
      const primaryContact = row.original.contacts.find(
        (cont) => cont.isPrimaryContact
      );

      if (!primaryContact) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }

      return (
        <div className="space-y-2 min-w-[160px]">
          <div className="flex items-center gap-1 mb-1">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {getContactTypeLabel(primaryContact.contactType)}
            </Badge>
          </div>
          <div className="text-sm">
            <p className="font-medium">{primaryContact.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-mono">
              {primaryContact.phoneNumber}
            </span>
          </div>
          {primaryContact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {primaryContact.email}
              </span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "npwp",
    header: "NPWP",
    cell: ({ row }) => {
      const npwp = row.original.npwpNumber;

      if (!npwp) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }

      return (
        <div className="flex items-center gap-2 ">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-mono">{npwp}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "statusActive",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusActive") as StatusActive;
      return getStatusBadge(status);
    },
  },
  {
    accessorKey: "activeDate",
    header: ({ column }) => {
      return (
        <DataTableColumnHeaderSort column={column} title="Tgl Bergabung" />
      );
    },
    cell: ({ row }) => {
      // const date = row.getValue("activeDate") as Date;
      const date = row.getValue("activeDate") as Date;
      if (!date) return <span className="text-muted-foreground">-</span>;

      return (
        <span className="text-sm font-medium text-muted-foreground">
          {format(new Date(date), "dd MMM yyyy", { locale: id })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => actions.onView(supplier)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(supplier)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(supplier)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
