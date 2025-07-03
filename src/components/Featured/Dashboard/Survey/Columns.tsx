"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  Printer,
  MapPin,
  Package,
  User,
  Calendar,
  Truck,
  Ship,
  Plane,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Save,
  History,
  Filter,
} from "lucide-react";
import {
  CargoType,
  ShipmentDetail,
  ShipmentType,
  SurveyStatus,
} from "@prisma/client";
import { DataTableColumnHeaderSort } from "../DataTableColumnHeaderSort";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_trpcClient/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SurveyItems {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  quantity: number;
  cbm: number;
  note: string | null;
}

interface SurveyStatusHistory {
  id: string;
  status: SurveyStatus;
  changedBy: string;
  changedAt: Date;
  remarks: string | null;
}

export interface SurveyInColumnsProps {
  id: string;
  surveyNo: string;
  surveyDate: Date;
  workDate: Date;
  customerId: string;
  origin: string;
  destination: string;
  cargoType: CargoType;
  shipmentType: ShipmentType;
  shipmentDetail: ShipmentDetail;
  statusSurvey: SurveyStatus;
  customer: {
    id: string;
    code: string;
    name: string;
  };
  surveyItems: SurveyItems[];
  statusHistories?: SurveyStatusHistory[];
}

interface ColumnActions {
  onView: (survey: SurveyInColumnsProps) => void;
  onPrintPdf: (survey: SurveyInColumnsProps) => void;
  onEdit: (survey: SurveyInColumnsProps) => void;
  onDelete: (survey: SurveyInColumnsProps) => void;
  onRefresh?: () => void;
}

// Helper functions
const formatDate = (date: Date) => {
  return format(new Date(date), "dd MMM yyyy", { locale: localeId });
};

const formatCBM = (value: number) => {
  return `${value.toFixed(4)} m³`;
};

const getStatusBadge = (status: SurveyStatus) => {
  const statusConfig = {
    ONPROGRESS: {
      label: "On Progress",
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800",
      icon: Clock,
    },
    APPROVED: {
      label: "Approved",
      variant: "default" as const,
      className: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    REJECT: {
      label: "Rejected",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800",
      icon: XCircle,
    },
  };
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <IconComponent className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const getCargoTypeBadge = (cargoType: CargoType) => {
  const cargoConfig = {
    FULL_TRUCK: {
      label: "Full Truck",
      icon: Truck,
      className: "bg-purple-100 text-purple-800",
    },
    FCL: {
      label: "FCL",
      icon: Package,
      className: "bg-orange-100 text-orange-800",
    },
    LCL: {
      label: "LCL",
      icon: Package,
      className: "bg-yellow-100 text-yellow-800",
    },
  };

  const config = cargoConfig[cargoType];
  const IconComponent = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <IconComponent className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// Status Editor Component
const StatusEditor = ({
  survey,
  onRefresh,
}: {
  survey: SurveyInColumnsProps;
  onRefresh?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SurveyStatus>(
    survey.statusSurvey
  );
  const [remarks, setRemarks] = useState("");

  const updateStatusMutation = trpc.survey.updateStatusSurvey.useMutation({
    onSuccess: () => {
      toast.success("Status survey berhasil diperbarui");
      setIsOpen(false);
      setRemarks("");
      onRefresh?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (selectedStatus === survey.statusSurvey) {
      toast.info("Status tidak berubah");
      setIsOpen(false);
      return;
    }

    if (selectedStatus === "REJECT" && !remarks.trim()) {
      toast.error("Keterangan wajib diisi untuk status Reject");
      return;
    }

    updateStatusMutation.mutate({
      id: survey.id,
      status: selectedStatus,
      remarks: remarks.trim() || undefined,
    });
  };

  const statusOptions = [
    { value: "ONPROGRESS" as const, label: "On Progress", icon: Clock },
    { value: "APPROVED" as const, label: "Approved", icon: CheckCircle },
    { value: "REJECT" as const, label: "Rejected", icon: XCircle },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-2"
          disabled={updateStatusMutation.isPending}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status Survey</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: SurveyStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="remarks">
              Keterangan
              {selectedStatus === "REJECT" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Textarea
              id="remarks"
              placeholder="Masukkan keterangan perubahan status..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setSelectedStatus(survey.statusSurvey);
                setRemarks("");
              }}
              disabled={updateStatusMutation.isPending}
            >
              <X className="h-3 w-3 mr-1" />
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// const SimpleHistoryButton = ({ surveyId }: { surveyId: string }) => (
//   <Button
//     variant="ghost"
//     size="sm"
//     className="h-6 w-6 p-0 ml-2 border border-gray-300"
//     onClick={() => console.log("History clicked:", surveyId)}
//   >
//     <History className="h-3 w-3" />
//   </Button>
// );

const StatusHistoryTooltip = ({ surveyId }: { surveyId: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: statusHistories, isLoading } =
    trpc.survey.getStatusSurveyHistory.useQuery(
      { id: surveyId },
      {
        enabled: isOpen, // Only fetch when tooltip is opened
        refetchOnWindowFocus: false,
      }
    );

  // ✅ REMOVED early return - Button harus selalu render!

  const sortedHistory = statusHistories
    ? [...statusHistories].sort(
        (a, b) =>
          new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      )
    : [];

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 ml-1 hover:bg-gray-100"
        >
          <History className="h-4 w-4 text-gray-600 hover:text-gray-800" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm p-3" side="left" align="start">
        <div className="space-y-2">
          <p className="font-medium text-sm">Riwayat Status:</p>

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 animate-spin" />
              <span>Memuat riwayat...</span>
            </div>
          ) : sortedHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">Tidak ada riwayat</p>
          ) : (
            <>
              {sortedHistory.slice(0, 5).map((history, index) => {
                const statusConfig = {
                  ONPROGRESS: {
                    label: "On Progress",
                    className: "bg-blue-100 text-blue-800",
                  },
                  APPROVED: {
                    label: "Approved",
                    className: "bg-green-100 text-green-800",
                  },
                  REJECT: {
                    label: "Rejected",
                    className: "bg-red-100 text-red-800",
                  },
                };
                const config = statusConfig[history.status];

                return (
                  <div key={history.id} className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={config.className}>{config.label}</Badge>
                      <span className="text-background">
                        {format(
                          new Date(history.changedAt),
                          "dd MMM yyyy HH:mm"
                        )}
                      </span>
                    </div>
                    {history.remarks && (
                      <p className="text-background italic pl-2 text-xs">
                        &#34;{history.remarks}&#34;
                      </p>
                    )}
                    {index < Math.min(sortedHistory.length, 5) - 1 && (
                      <div className="border-b border-muted my-1" />
                    )}
                  </div>
                );
              })}
              {sortedHistory.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  ... dan {sortedHistory.length - 5} lainnya
                </p>
              )}
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const getShipmentDetailIcon = (detail: ShipmentDetail) => {
  const icons = {
    SEA: Ship,
    DOM: Truck,
    AIR: Plane,
  };
  return icons[detail];
};

export const SurveyInColumns = (
  actions: ColumnActions
): ColumnDef<SurveyInColumnsProps>[] => [
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
    accessorKey: "surveyNo",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="No. Survey" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm font-medium">
          {row.getValue("surveyNo")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "surveyDate",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Tanggal Survey" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatDate(row.getValue("surveyDate"))}
          </span>
          <span className="text-xs text-muted-foreground">
            Kerja: {formatDate(row.original.workDate)}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeaderSort column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{customer.name}</span>
            <span className="text-xs text-muted-foreground">
              {customer.code}
            </span>
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.customer.name.localeCompare(
        rowB.original.customer.name
      );
    },
  },
  {
    id: "route",
    header: "Rute Pengiriman",
    cell: ({ row }) => {
      const { origin, destination, shipmentDetail } = row.original;
      const IconComponent = getShipmentDetailIcon(shipmentDetail);

      return (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{origin}</span>
              <IconComponent className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{destination}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {shipmentDetail} • {row.original.shipmentType}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "cargoType",
    header: "Jenis Muatan",
    cell: ({ row }) => getCargoTypeBadge(row.getValue("cargoType")),
  },
  {
    id: "itemsSummary",
    header: "Detail Barang",
    cell: ({ row }) => {
      const items = row.original.surveyItems;
      const totalItems = items.length;
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCBM = items.reduce((sum, item) => sum + item.cbm, 0);

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">
              {totalItems} jenis, {totalQty} item
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Total: {formatCBM(totalCBM)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "statusSurvey",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <DataTableColumnHeaderSort column={column} title="Status" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Filter className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={!column.getFilterValue()}
              onCheckedChange={() => column.setFilterValue(undefined)}
            >
              Semua Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={column.getFilterValue() === "ONPROGRESS"}
              onCheckedChange={(checked) =>
                column.setFilterValue(checked ? "ONPROGRESS" : undefined)
              }
            >
              On Progress
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={column.getFilterValue() === "APPROVED"}
              onCheckedChange={(checked) =>
                column.setFilterValue(checked ? "APPROVED" : undefined)
              }
            >
              Approved
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={column.getFilterValue() === "REJECT"}
              onCheckedChange={(checked) =>
                column.setFilterValue(checked ? "REJECT" : undefined)
              }
            >
              Rejected
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    cell: ({ row }) => {
      const survey = row.original;
      return (
        <TooltipProvider>
          <div className="flex items-center">
            {getStatusBadge(survey.statusSurvey)}
            <StatusEditor survey={survey} onRefresh={actions.onRefresh} />
            <StatusHistoryTooltip surveyId={survey.id} />
          </div>
        </TooltipProvider>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      return row.getValue(id) === value;
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const survey = row.original;

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
            <DropdownMenuItem onClick={() => actions.onView(survey)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(survey)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onPrintPdf(survey)}>
              <Printer className="mr-2 h-4 w-4" />
              Print PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(survey)}
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
