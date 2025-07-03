"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Save,
  Trash2,
  Package,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { CargoType, ShipmentDetail, ShipmentType } from "@prisma/client";
import { SurveyFormData, SurveyFormDataSchema } from "@/schemas/surveySchema";
import { formatDate } from "@/tools/formatDateLocal";

// Define interfaces
interface Customer {
  id: string;
  code: string;
  name: string;
  contacts: {
    name: string;
    email?: string | null;
    phoneNumber: string;
  }[];
}

interface Survey {
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
  statusSurvey: "ONPROGRESS" | "APPROVED" | "REJECT";
  customer: {
    id: string;
    code: string;
    name: string;
  };
  surveyItems: {
    id: string;
    name: string;
    width: number;
    length: number;
    height: number;
    quantity: number;
    cbm: number;
    note: string | null;
  }[];
}

interface SurveyFormProps {
  survey?: Survey;
  customers: Customer[];
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Get default values function
const getDefaultValues = (
  mode: "create" | "edit",
  survey?: Survey
): SurveyFormData => {
  if (mode === "edit" && survey) {
    return {
      surveyDate: formatDate(survey.surveyDate), //format(new Date(survey.surveyDate), "yyyy-MM-dd"),
      workDate: formatDate(survey.workDate), //format(new Date(survey.workDate), "yyyy-MM-dd"),
      customerId: survey.customerId,
      origin: survey.origin,
      destination: survey.destination,
      cargoType: survey.cargoType,
      shipmentType: survey.shipmentType,
      shipmentDetail: survey.shipmentDetail,
      surveyItems: survey.surveyItems.map((item) => ({
        name: item.name,
        width: item.width.toString(),
        length: item.length.toString(),
        height: item.height.toString(),
        quantity: item.quantity.toString(),
        cbm: item.cbm.toString(),
        note: item.note || "",
      })),
    };
  }

  return {
    surveyDate: format(new Date(), "yyyy-MM-dd"),
    workDate: format(new Date(), "yyyy-MM-dd"),
    customerId: "",
    origin: "",
    destination: "",
    cargoType: "FCL",
    shipmentType: "DOMESTIC",
    shipmentDetail: "SEA",
    surveyItems: [
      {
        name: "",
        width: "",
        length: "",
        height: "",
        quantity: "1",
        cbm: "",
        note: "",
      },
    ],
  };
};

export function SurveyForm({
  survey,
  customers,
  mode,
  onSuccess,
  onCancel,
}: SurveyFormProps) {
  const utils = trpc.useUtils();
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(SurveyFormDataSchema),
    defaultValues: getDefaultValues(mode, survey),
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "surveyItems",
  });

  //   const watchCustomerId = form.watch("customerId");
  const { isDirty, isValid } = form.formState;

  // Mutations
  const createMutation = trpc.survey.createSurvey.useMutation({
    onSuccess: () => {
      toast.success("Survey berhasil dibuat");
      utils.survey.getAllSurvey.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/survey");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.survey.updateSurvey.useMutation({
    onSuccess: () => {
      toast.success("Survey berhasil diperbarui");
      utils.survey.getAllSurvey.invalidate();
      utils.survey.getSurveyById.invalidate({ id: survey?.id });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: SurveyFormData) => {
    const submitData = {
      surveyDate: new Date(data.surveyDate),
      workDate: new Date(data.workDate),
      customerId: data.customerId,
      origin: data.origin,
      destination: data.destination,
      cargoType: data.cargoType,
      shipmentType: data.shipmentType,
      shipmentDetail: data.shipmentDetail,
      surveyItems: data.surveyItems.map((item) => ({
        name: item.name,
        width: parseFloat(item.width),
        length: parseFloat(item.length),
        height: parseFloat(item.height),
        quantity: parseInt(item.quantity),
        cbm: parseFloat(item.cbm),
        note: item.note || undefined,
      })),
    };

    if (mode === "create") {
      createMutation.mutate(submitData);
    } else if (survey) {
      updateMutation.mutate({
        id: survey.id,
        ...submitData,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEdit = mode === "edit";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informasi Survey
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Survey Date */}
            <FormField
              control={form.control}
              name="surveyDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Tanggal Survey <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isEdit} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Date */}
            <FormField
              control={form.control}
              name="workDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Tanggal Pekerjaan <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Field */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="flex flex-col col-span-2">
                  <FormLabel>
                    Customer <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={customerOpen}
                          className={cn(
                            "w-full justify-between h-auto min-h-[40px] py-2",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isEdit}
                        >
                          {field.value
                            ? (() => {
                                const selectedCustomer = customers.find(
                                  (customer) => customer.id === field.value
                                );
                                const primaryContact =
                                  selectedCustomer?.contacts[0];
                                return (
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {selectedCustomer?.code} -{" "}
                                      {selectedCustomer?.name}
                                    </span>
                                    {primaryContact && (
                                      <span className="text-xs text-muted-foreground">
                                        PIC: {primaryContact.name} |{" "}
                                        {primaryContact.phoneNumber} |{" "}
                                        {primaryContact.email}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
                            : "Pilih customer"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0 max-h-60 overflow-y-auto"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Cari customer..." />
                        <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => {
                            const primaryContact = customer.contacts[0]; // First contact is primary since we filtered
                            return (
                              <CommandItem
                                key={customer.id}
                                value={customer.code + " " + customer.name}
                                onSelect={() => {
                                  field.onChange(customer.id);
                                  setCustomerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === customer.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <div className="font-medium">
                                    {customer.code} - {customer.name}
                                  </div>
                                  {primaryContact && (
                                    <div className="text-sm text-muted-foreground">
                                      PIC: {primaryContact.name} |{" "}
                                      {primaryContact.phoneNumber}
                                      {primaryContact.email &&
                                        ` | ${primaryContact.email}`}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pengiriman</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Origin */}
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Asal <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Kota asal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destination */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tujuan <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Kota tujuan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cargo Type */}
            <FormField
              control={form.control}
              name="cargoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jenis Muatan <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis muatan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FULL_TRUCK">Full Truck</SelectItem>
                      <SelectItem value="FCL">FCL</SelectItem>
                      <SelectItem value="LCL">LCL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shipment Type */}
            <FormField
              control={form.control}
              name="shipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jenis Pengiriman <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis pengiriman" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DOMESTIC">Domestik</SelectItem>
                      <SelectItem value="INTERNATIONAL">
                        Internasional
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shipment Detail */}
            <FormField
              control={form.control}
              name="shipmentDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Detail Pengiriman <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih detail pengiriman" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SEA">Sea</SelectItem>
                      <SelectItem value="DOM">Dom</SelectItem>
                      <SelectItem value="AIR">Air</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detail Barang</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: "",
                    width: "",
                    length: "",
                    height: "",
                    quantity: "1",
                    cbm: "",
                    note: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Barang
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">
                    Nama Barang <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-28">
                    Lebar (cm) <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-28">
                    Panjang (cm) <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-28">
                    Tinggi (cm) <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-20">
                    Qty <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-32">CBM</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    {/* Item Name */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Nama barang" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Width */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Trigger CBM calculation immediately
                                  setTimeout(() => {
                                    const currentItems =
                                      form.getValues("surveyItems");
                                    const item = currentItems[index];
                                    const width =
                                      parseFloat(e.target.value) || 0;
                                    const length =
                                      parseFloat(item?.length || "0") || 0;
                                    const height =
                                      parseFloat(item?.height || "0") || 0;
                                    const quantity =
                                      parseInt(item?.quantity || "0") || 0;

                                    if (
                                      width > 0 &&
                                      length > 0 &&
                                      height > 0 &&
                                      quantity > 0
                                    ) {
                                      const cbm =
                                        ((width * length * height) / 1000000) *
                                        quantity;
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        cbm.toFixed(4),
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    } else {
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        "",
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    }
                                  }, 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Length */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.length`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Trigger CBM calculation immediately
                                  setTimeout(() => {
                                    const currentItems =
                                      form.getValues("surveyItems");
                                    const item = currentItems[index];
                                    const width =
                                      parseFloat(item?.width || "0") || 0;
                                    const length =
                                      parseFloat(e.target.value) || 0;
                                    const height =
                                      parseFloat(item?.height || "0") || 0;
                                    const quantity =
                                      parseInt(item?.quantity || "0") || 0;

                                    if (
                                      width > 0 &&
                                      length > 0 &&
                                      height > 0 &&
                                      quantity > 0
                                    ) {
                                      const cbm =
                                        ((width * length * height) / 1000000) *
                                        quantity;
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        cbm.toFixed(4),
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    } else {
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        "",
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    }
                                  }, 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Height */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Trigger CBM calculation immediately
                                  setTimeout(() => {
                                    const currentItems =
                                      form.getValues("surveyItems");
                                    const item = currentItems[index];
                                    const width =
                                      parseFloat(item?.width || "0") || 0;
                                    const length =
                                      parseFloat(item?.length || "0") || 0;
                                    const height =
                                      parseFloat(e.target.value) || 0;
                                    const quantity =
                                      parseInt(item?.quantity || "0") || 0;

                                    if (
                                      width > 0 &&
                                      length > 0 &&
                                      height > 0 &&
                                      quantity > 0
                                    ) {
                                      const cbm =
                                        ((width * length * height) / 1000000) *
                                        quantity;
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        cbm.toFixed(4),
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    } else {
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        "",
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    }
                                  }, 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Trigger CBM calculation immediately
                                  setTimeout(() => {
                                    const currentItems =
                                      form.getValues("surveyItems");
                                    const item = currentItems[index];
                                    const width =
                                      parseFloat(item?.width || "0") || 0;
                                    const length =
                                      parseFloat(item?.length || "0") || 0;
                                    const height =
                                      parseFloat(item?.height || "0") || 0;
                                    const quantity =
                                      parseInt(e.target.value) || 0;

                                    if (
                                      width > 0 &&
                                      length > 0 &&
                                      height > 0 &&
                                      quantity > 0
                                    ) {
                                      const cbm =
                                        ((width * length * height) / 1000000) *
                                        quantity;
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        cbm.toFixed(4),
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    } else {
                                      form.setValue(
                                        `surveyItems.${index}.cbm`,
                                        "",
                                        {
                                          shouldValidate: false,
                                          shouldDirty: false,
                                        }
                                      );
                                    }
                                  }, 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* CBM (Auto calculated) */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.cbm`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Auto"
                                {...field}
                                readOnly
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Notes */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`surveyItems.${index}.note`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Catatan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Remove Button */}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {isDirty && (
              <Badge variant="outline" className="bg-yellow-50">
                Ada perubahan yang belum disimpan
              </Badge>
            )}
            {!isValid && isDirty && (
              <Badge variant="outline" className="bg-red-50">
                Silakan lengkapi field yang diperlukan
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading
                ? "Menyimpan..."
                : mode === "create"
                ? "Simpan Survey"
                : "Perbarui Survey"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
