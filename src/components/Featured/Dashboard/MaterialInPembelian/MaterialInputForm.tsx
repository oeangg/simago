"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Plus, Save, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateMaterialInInput } from "@/schemas/materialInSchema";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { z } from "zod";
import { StockType } from "@prisma/client";
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
import { MaterialSelectCell } from "./MaterialSelectedCell";
import { useRouter } from "next/navigation";

// Define interfaces
interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  goodStock: number;
  badStock: number;
  lastPurchasePrice?: number | null;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
  address?: string;
  phoneNumber?: string;
}

interface MaterialIn {
  id: string;
  transactionNo: string;
  supplierId: string;
  supplierName: string;
  transactionDate: Date;
  invoiceNo?: string | null;
  totalAmountBeforeTax: number;
  totalTax?: number | null;

  otherCosts?: number | null;
  totalAmount: number;
  notes?: string | null;
  items: {
    id: string;
    materialId: string;
    quantity: number;
    unitPrice: number;
    stockType: StockType;
    totalPrice: number;
    notes?: string | null;
  }[];
}

interface MaterialInFormProps {
  materialIn?: MaterialIn;
  materials: Material[];
  suppliers: Supplier[];
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

//  Form validation schema
const materialInFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  supplierName: z.string().min(1),
  transactionDate: z.date(),
  invoiceNo: z.string(),
  totalAmountBeforeTax: z.number().min(0),
  totalTax: z.number().min(0),
  taxPercentage: z.number().min(0).max(20).optional(),
  otherCosts: z.number().min(0),
  totalAmount: z.number().min(0),
  notes: z.string(),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1, "Material harus dipilih"),
        stockType: z.nativeEnum(StockType),
        quantity: z.number().int().positive("Quantity harus lebih dari 0"),
        unitPrice: z.number().min(0, "Harga tidak boleh negatif"),
        notes: z.string(),
      })
    )
    .min(1, "Minimal harus ada 1 item"),
});

export type MaterialInFormData = {
  supplierId: string;
  supplierName: string;
  transactionDate: Date;
  invoiceNo: string;
  totalAmountBeforeTax: number;
  totalTax: number;
  taxPercentage?: number;
  otherCosts: number;
  totalAmount: number;
  notes: string;
  items: {
    materialId: string;
    stockType: StockType;
    quantity: number;
    unitPrice: number;
    notes: string;
  }[];
};

// Get default values function
const getDefaultValues = (
  mode: "create" | "edit",
  materialIn?: MaterialIn
): MaterialInFormData => {
  if (mode === "edit" && materialIn) {
    return {
      supplierId: materialIn.supplierId,
      supplierName: materialIn.supplierName,
      transactionDate: new Date(materialIn.transactionDate),
      invoiceNo: materialIn.invoiceNo || "",
      totalAmountBeforeTax: materialIn.totalAmountBeforeTax,
      totalTax: materialIn.totalTax || 0,
      taxPercentage: 0,
      otherCosts: materialIn.otherCosts || 0,
      totalAmount: materialIn.totalAmount,
      notes: materialIn.notes || "",
      items: materialIn.items.map((item) => ({
        stockType: item.stockType,
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes || "",
      })),
    };
  }

  return {
    supplierId: "",
    supplierName: "",
    transactionDate: new Date(),
    invoiceNo: "",
    totalAmountBeforeTax: 0,
    totalTax: 0,
    otherCosts: 0,
    totalAmount: 0,
    taxPercentage: 0,
    notes: "",
    items: [
      {
        materialId: "",
        stockType: "GOOD" as StockType,
        quantity: 1,
        unitPrice: 0,
        notes: "",
      },
    ],
  };
};

export function MaterialInForm({
  materialIn,
  materials,
  suppliers,
  mode,
  onSuccess,
  onCancel,
}: MaterialInFormProps) {
  const utils = trpc.useUtils();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm<MaterialInFormData>({
    resolver: zodResolver(materialInFormSchema),
    defaultValues: getDefaultValues(mode, materialIn),
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchSupplierId = form.watch("supplierId");
  const { isDirty, isValid } = form.formState;

  // Calculate totals
  const watchItems = form.watch("items");
  const subtotal = watchItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  useEffect(() => {
    form.setValue("totalAmountBeforeTax", subtotal);
  }, [subtotal, form]);

  const watchTotalTax = form.watch("totalTax");
  const watchOtherCosts = form.watch("otherCosts");
  const taxPercentage = form.watch("taxPercentage");

  useEffect(() => {
    if (subtotal && taxPercentage) {
      const calculatedTax = (subtotal * taxPercentage) / 100;
      form.setValue("totalTax", calculatedTax);
    }
  }, [subtotal, taxPercentage, form]);

  useEffect(() => {
    const total = subtotal + (watchTotalTax || 0) + (watchOtherCosts || 0);
    form.setValue("totalAmount", total);
  }, [subtotal, watchTotalTax, watchOtherCosts, form]);

  // Update supplier name when supplier selected
  useEffect(() => {
    if (watchSupplierId) {
      const supplier = suppliers.find((s) => s.id === watchSupplierId);
      if (supplier) {
        form.setValue("supplierName", supplier.name);
      }
    }
  }, [watchSupplierId, suppliers, form]);

  // Mutations
  const createMutation = trpc.MaterialIn.createMaterialIn.useMutation({
    onSuccess: () => {
      toast.success("Material In berhasil dibuat");
      utils.MaterialIn.getMaterialInAll.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/pembelian-material");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.MaterialIn.updateMaterialIn.useMutation({
    onSuccess: () => {
      toast.success("Material In berhasil diperbarui");
      utils.MaterialIn.getMaterialInAll.invalidate();
      utils.MaterialIn.getMaterialInById.invalidate({ id: materialIn?.id });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: MaterialInFormData) => {
    const submitData = {
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      transactionDate: data.transactionDate,
      invoiceNo: data.invoiceNo,
      totalAmountBeforeTax: data.totalAmountBeforeTax,
      totalTax: data.totalTax,
      otherCosts: data.otherCosts,
      totalAmount: data.totalAmount,
      notes: data.notes,
      items: data.items,
    };
    if (mode === "create") {
      createMutation.mutate(submitData as CreateMaterialInInput);
    } else if (materialIn) {
      updateMutation.mutate({
        id: materialIn.id,
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
            <CardTitle>
              {/* {mode === "create"
                ? "Tambah Material Masuk"
                : "Edit Material Masuk"} */}
              Informasi Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4  items-end ">
            {/* Transaction Date */}
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Transaksi</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isEdit}
                      {...field}
                      value={
                        field.value ? format(field.value, "yyyy-MM-dd") : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Invoice No */}
            <FormField
              control={form.control}
              name="invoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    No. Invoice <span className="font-light">*(jika ada)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor invoice supplier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplier Field */}
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-col col-span-2 ">
                    <FormLabel>
                      Supplier <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isEdit}
                          >
                            {field.value
                              ? suppliers.find(
                                  (supplier) => supplier.id === field.value
                                )?.code +
                                " - " +
                                suppliers.find(
                                  (supplier) => supplier.id === field.value
                                )?.name
                              : "Pilih supplier"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Cari supplier..." />
                          <CommandEmpty>Supplier tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {suppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.code + " " + supplier.name}
                                onSelect={() => {
                                  field.onChange(supplier.id);
                                  setOpen(false); // Close popover after selection
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === supplier.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {supplier.code} - {supplier.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detail Material</CardTitle>
              <Button
                type="button"
                variant="outline"
                disabled={isEdit}
                size="sm"
                onClick={() =>
                  append({
                    materialId: "",
                    stockType: StockType.GOOD,
                    quantity: 1,
                    unitPrice: 0,
                    notes: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEdit ? (
              <div className="rounded-md border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Detail items tidak dapat diubah setelah transaksi dibuat
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-64">
                        Material <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead className="w-20">
                        Type Stock <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead className="w-40">
                        Harga Satuan <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead className="w-24">
                        Qty <span className="text-red-500">*</span>
                      </TableHead>

                      <TableHead className="w-32">Total</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      // const material = materials.find(
                      //   (m) => m.id === watchItems[index]?.materialId
                      // );
                      const itemTotal =
                        (watchItems[index]?.quantity || 0) *
                        (watchItems[index]?.unitPrice || 0);

                      return (
                        <TableRow key={field.id}>
                          {/* //material */}

                          <MaterialSelectCell
                            form={form}
                            index={index}
                            materials={materials}
                            watchItems={watchItems}
                            isEdit={isEdit}
                          />
                          {/* // Add select for stock type in table */}
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.stockType`}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || "GOOD"}
                                  disabled={isEdit}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GOOD">Good</SelectItem>
                                    <SelectItem value="BAD">Bad</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      disabled={isEdit}
                                      placeholder="0"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      disabled={isEdit}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>

                          <TableCell>
                            <p className="font-medium">
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                              }).format(itemTotal)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Catatan"
                                      {...field}
                                      disabled={isEdit}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Normal editable table for create mode
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">
                      Material <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-20">
                      Type Stock <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-40">
                      Harga Satuan <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="w-24">
                      Qty <span className="text-red-500">*</span>
                    </TableHead>

                    <TableHead className="w-32">Total</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    // const material = materials.find(
                    //   (m) => m.id === watchItems[index]?.materialId
                    // );
                    const itemTotal =
                      (watchItems[index]?.quantity || 0) *
                      (watchItems[index]?.unitPrice || 0);

                    return (
                      <TableRow key={field.id}>
                        {/* //material */}

                        <MaterialSelectCell
                          form={form}
                          index={index}
                          materials={materials}
                          watchItems={watchItems}
                          isEdit={isEdit}
                        />
                        {/* // Add select for stock type in table */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.stockType`}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "GOOD"}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GOOD">Good</SelectItem>
                                  <SelectItem value="BAD">Bad</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(itemTotal)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.notes`}
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan tambahan"
                        rows={4}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="space-y-2 ">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Tax Field */}
                <div className="flex flex-col gap-3">
                  {/* Tax Percentage Input */}
                  <div className="flex items-center justify-between gap-4 mr-5">
                    <label
                      htmlFor="taxPercentage"
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      Pajak
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Tax Amount Field */}

                      <Controller
                        control={form.control}
                        name="taxPercentage" // Field sementara, tidak disimpan ke DB
                        render={({ field }) => (
                          <Input
                            id="taxPercentage"
                            type="number"
                            placeholder="0"
                            min="0"
                            max="20"
                            step="0.1"
                            className=" w-16"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const percentage = Number(e.target.value);
                              field.onChange(percentage);

                              // Auto-calculate tax berdasarkan subtotal
                              const currentSubtotal = form.getValues(
                                "totalAmountBeforeTax"
                              );
                              const calculatedTax =
                                (currentSubtotal * percentage) / 100;

                              // Update field totalTax
                              form.setValue("totalTax", calculatedTax);
                            }}
                          />
                        )}
                      />
                      <label className="text-sm font-medium whitespace-nowrap">
                        %
                      </label>
                      <Controller
                        control={form.control}
                        name="totalTax"
                        render={({ field }) => (
                          <Input
                            id="totalTax"
                            type="number"
                            placeholder="0"
                            className="ml-auto w-40 text-right"
                            disabled
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const taxAmount = Number(e.target.value);
                              field.onChange(taxAmount);

                              // Optional: Update persentase jika user manual edit tax amount
                              const currentSubtotal = form.getValues(
                                "totalAmountBeforeTax"
                              );
                              if (currentSubtotal > 0) {
                                const calculatedPercentage =
                                  (taxAmount / currentSubtotal) * 100;
                                form.setValue(
                                  "taxPercentage",
                                  Math.min(calculatedPercentage, 20)
                                );
                              }
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
                {/* Other Costs Field */}
                <div className="flex items-center gap-4 mr-5">
                  <label
                    htmlFor="otherCosts"
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Biaya Lain
                  </label>
                  <Controller
                    control={form.control}
                    name="otherCosts"
                    render={({ field }) => (
                      <Input
                        id="otherCosts"
                        type="number"
                        placeholder="0"
                        className="ml-auto  w-40 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(form.watch("totalAmount"))}
                  </span>
                </div>
              </div>
            </div>
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
                ? "Simpan"
                : "Perbarui"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
