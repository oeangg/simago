"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { trpc } from "@/app/_trpcClient/client";

import { Brand, MaterialCategory, Unit } from "@prisma/client";
import {
  createMaterialSchema,
  CreateMaterialTypeSchema,
  updateMaterialSchema,
  UpdateMaterialTypeSchema,
} from "@/schemas/materialSchema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Package,
  Info,
  BarChart3,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MaterialFormData {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  category: MaterialCategory;
  unit: Unit;
  brand: Brand;
  minimumStock: number;
  maximumStock?: number | null;
  goodStock?: number | null;
  badStock?: number | null;
  lastPurchasePrice?: number | null;
}

interface MaterialFormProps {
  material?: MaterialFormData;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export type MaterialTypeFormDataSchema =
  | CreateMaterialTypeSchema
  | UpdateMaterialTypeSchema;

// Type guard tetap sama
function isUpdateData(
  data: MaterialTypeFormDataSchema
): data is UpdateMaterialTypeSchema {
  return "id" in data;
}

// Category options dengan label yang lebih user-friendly
const categoryOptions = [
  { value: "PACKAGING", label: "Kemasan" },
  { value: "TOOLS", label: "Perkakas" },
  { value: "SPARE_PARTS", label: "Suku Cadang" },
  { value: "CONSUMABLES", label: "Bahan Habis Pakai" },
  { value: "RAW_MATERIAL", label: "Bahan Baku" },
];

// Unit options
const unitOptions = [
  { value: "PCS", label: "PCS (Pieces)" },
  { value: "KG", label: "Kilogram" },
  { value: "LITER", label: "Liter" },
  { value: "METER", label: "Meter" },
  { value: "BOX", label: "Box" },
  { value: "SET", label: "Set" },
  { value: "PACK", label: "Pack" },
  { value: "ROLL", label: "Roll" },
];

// Brand options
const brandOptions = [
  { value: "MITSUBISHI", label: "Mitsubishi" },
  { value: "SCHNEIDER", label: "Schneider Electric" },
  { value: "SIEMENS", label: "Siemens" },
  { value: "OTHER", label: "Lainnya" },
];

export function MaterialForm({
  material,
  mode,
  onSuccess,
  onCancel,
}: MaterialFormProps) {
  const {
    data: materialData,
    isLoading: isLoadingMaterial,
    isPending: isPendingMaterial,
  } = trpc.Material.getMaterialById.useQuery(
    { id: material?.id || "" },
    { enabled: mode === "edit" && !!material?.id }
  );

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getDefaultValues = useCallback((): MaterialTypeFormDataSchema => {
    if (mode === "edit" && materialData) {
      return {
        id: materialData.id,
        name: materialData.name,
        description: materialData.description || undefined,
        category: materialData.category,
        unit: materialData.unit,
        brand: materialData.brand,
        minimumStock: materialData.minimumStock,
        maximumStock: materialData.maximumStock ?? undefined,
        goodStock: materialData.goodStock ?? undefined,
        badStock: materialData.badStock ?? undefined,
        lastPurchasePrice:
          materialData.lastPurchasePrice?.toNumber() ?? undefined,
      };
    }

    return {
      name: "",
      description: "",
      category: "RAW_MATERIAL" as MaterialCategory,
      unit: "BOX" as Unit,
      brand: "SCHNEIDER" as Brand,
      minimumStock: 0,
      maximumStock: undefined,
      goodStock: undefined,
      badStock: undefined,
      lastPurchasePrice: undefined,
    };
  }, [materialData, mode]);

  const resolver =
    mode === "create"
      ? (zodResolver(
          createMaterialSchema
        ) as Resolver<CreateMaterialTypeSchema>)
      : (zodResolver(
          updateMaterialSchema
        ) as Resolver<UpdateMaterialTypeSchema>);

  const form = useForm<MaterialTypeFormDataSchema>({
    resolver: resolver as Resolver<MaterialTypeFormDataSchema>,
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Re-initialize form (edit mode)
  useEffect(() => {
    if (mode === "edit" && materialData && !isPendingMaterial) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
    }
  }, [materialData, mode, isPendingMaterial, form, getDefaultValues]);

  // Get form state
  const { isDirty, isValid } = form.formState;

  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.Material.createMaterial.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Material berhasil dibuat");
      utils.Material.getAllMaterial.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/material");
      }
    },
    onError: (error) => {
      console.error("Create material error:", error);
      toast.error(error.message || "Gagal membuat data material");
    },
  });

  const updateMutation = trpc.Material.updateMaterial.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Material berhasil diperbarui");
      utils.Material.getAllMaterial.invalidate();
      utils.Material.getMaterialById.invalidate({ id: material?.id });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/material");
      }
    },
    onError: (error) => {
      console.error("Update material error:", error);
      toast.error(error.message || "Gagal memperbarui data material");
    },
  });

  const onSubmitMaterial = async (data: MaterialTypeFormDataSchema) => {
    setIsLoading(true);
    try {
      if (mode === "create" && !isUpdateData(data)) {
        await createMutation.mutateAsync(data as CreateMaterialTypeSchema);
      } else if (mode === "edit" && isUpdateData(data)) {
        await updateMutation.mutateAsync(data as UpdateMaterialTypeSchema);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmCancel = confirm(
        "Ada perubahan yang belum disimpan. Yakin ingin membatalkan?"
      );
      if (!confirmCancel) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard/material");
    }
  };

  if (mode === "edit" && (isLoadingMaterial || isPendingMaterial)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmitMaterial)}
          className="space-y-6"
        >
          {/* Material Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informasi Material
              </CardTitle>
              <CardDescription>
                Masukkan informasi dasar material
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Material <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama material" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan deskripsi material (opsional)"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Informasi tambahan tentang material
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kategori <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Satuan <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Brand <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brandOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Informasi Stok
              </CardTitle>
              <CardDescription>
                Atur informasi stok dan level minimum/maksimum
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-4 place-items-start ">
                <FormField
                  control={form.control}
                  name="minimumStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Stok Minimum <span className="text-red-500">*</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Batas minimum stok sebelum perlu reorder</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maximumStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stok Maksimum
                        <span className="text-muted-foreground ml-2">
                          (Opsional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Tidak ada batas"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : null);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Batas maksimum penyimpanan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goodStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stok Bagus
                        <span className="text-muted-foreground ml-2">
                          (Opsional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : null);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Jumlah stok dalam kondisi baik
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="badStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stok Rusak
                        <span className="text-muted-foreground ml-2">
                          (Opsional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : null);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Jumlah stok dalam kondisi rusak
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Stock Status Alert */}
              {(form.watch("goodStock") ?? 0) <
                (form.watch("minimumStock") ?? 0) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">
                    Stok saat ini berada di bawah stok minimum!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informasi Harga
              </CardTitle>
              <CardDescription>
                Informasi harga pembelian terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="lastPurchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Harga Pembelian Terakhir
                      <span className="text-muted-foreground ml-2">
                        (Opsional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <p className=" absolute z-10 left-4  top-1/2 -translate-y-1/2 text-muted-foreground">
                          Rp
                        </p>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="pl-14"
                          {...field}
                          // cek instance dari Prisma.Decimal, jika ya maka convert ke string dengan .toString().
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseFloat(value) : null);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Harga pembelian terakhir per unit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
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
              {!isDirty && !isValid && mode === "create" && (
                <Badge variant="outline" className="bg-blue-50">
                  Lengkapi semua field wajib{" "}
                  <span className="text-red-500">(*)</span>
                </Badge>
              )}
              {mode === "edit" && !isDirty && (
                <Badge variant="outline" className="bg-gray-50">
                  Belum ada perubahan
                </Badge>
              )}
              {mode === "edit" && isDirty && isValid && (
                <Badge variant="outline" className="bg-green-50">
                  Siap untuk disimpan
                </Badge>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValid || (mode === "edit" && !isDirty)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === "create" ? "Simpan Material" : "Update Material"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}
