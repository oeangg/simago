"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/app/_trpcClient/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User } from "lucide-react";
import { Gender } from "@prisma/client";

import {
  driverSchema,
  DriverTypeSchema,
  driverUpdateSchema,
  DriverUpdateTypeSchema,
} from "@/schemas/driverSchema";
import { Switch } from "@/components/ui/switch";
import { formatDateForInput } from "@/tools/formatDateForInput";

interface DriverFormData {
  id?: string;
  code: string;
  name: string;
  gender: Gender;
  statusActive: boolean;
  activeDate: Date | string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  phoneNumber: string;
}
interface DriverFormProps {
  driver?: DriverFormData;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

type DriverTypeFormDataSchema = DriverTypeSchema | DriverUpdateTypeSchema;

// Type guard untuk check apakah data memiliki id (untuk update)
function isUpdateData(
  data: DriverTypeFormDataSchema
): data is DriverUpdateTypeSchema {
  return "id" in data;
}

export function DriverForm({
  driver,
  mode,
  onSuccess,
  onCancel,
}: DriverFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: driverData,
    isLoading: isLoadingDriver,
    isPending: isPendingDriver,
  } = trpc.Driver.getDriverById.useQuery(
    { id: driver?.id || "" },
    { enabled: mode === "edit" && !!driver?.id }
  );

  // Initialize form default values
  const getDefaultValues = useCallback((): DriverTypeFormDataSchema => {
    if (mode === "edit" && driverData) {
      return {
        id: driverData.id,
        code: driverData.code,
        name: driverData.name,
        gender: driverData.gender as Gender,
        addressLine1: driverData.addressLine1,
        addressLine2: driverData.addressLine2 || "",
        city: driverData.city,
        phoneNumber: driverData.phoneNumber,
        statusActive: driverData.statusActive,
        activeDate: formatDateForInput(driverData.activeDate),
      };
    }

    return {
      code: "",
      name: "",
      gender: "MALE" as Gender,
      addressLine1: "",
      addressLine2: "",
      city: "",
      phoneNumber: "",
      statusActive: true,
      activeDate: new Date().toISOString().split("T")[0],
    };
  }, [driverData, mode]);

  // Initialize form

  const resolver =
    mode === "create"
      ? (zodResolver(driverSchema) as Resolver<DriverTypeSchema>)
      : (zodResolver(driverUpdateSchema) as Resolver<DriverUpdateTypeSchema>);

  const form = useForm<DriverTypeFormDataSchema>({
    resolver: resolver as Resolver<DriverTypeFormDataSchema>,
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Re-initialize form (edit mode)
  useEffect(() => {
    if (mode === "edit" && driverData && !isPendingDriver) {
      form.reset(getDefaultValues());
    }
  }, [driverData, mode, isPendingDriver, form, getDefaultValues]);

  // Get form state
  const { isDirty, isValid } = form.formState;

  // tRPC utils
  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.Driver.createDriver.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.Driver.getAllDrivers.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/driver");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat data driver");
    },
  });

  const updateMutation = trpc.Driver.updateDriver.useMutation({
    onSuccess: () => {
      toast.success("Data driver berhasil diperbarui");
      utils.Driver.getAllDrivers.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/driver");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui data driver");
    },
  });

  // Submit handler
  const onSubmitDriver = async (data: DriverTypeFormDataSchema) => {
    setIsLoading(true);
    try {
      const submitData = data;

      if (mode === "create" && !isUpdateData(data)) {
        await createMutation.mutateAsync(submitData as DriverTypeSchema);
      } else if (mode === "edit" && isUpdateData(data)) {
        await updateMutation.mutateAsync(submitData as DriverUpdateTypeSchema);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard/driver");
    }
  }, [onCancel, router]);

  if (mode === "edit" && (isLoadingDriver || isPendingDriver)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitDriver)} className="space-y-6">
        {/* Driver Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Driver
            </CardTitle>
            <CardDescription>Masukkan informasi dasar Driver</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kode Driver <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex : DV-001"
                        {...field}
                        disabled={mode === "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Driver <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama Driver" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Laki-laki</SelectItem>
                          <SelectItem value="FEMALE">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nomor Telepon <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan nomor telepon"
                        {...field}
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Alamat Baris 1 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan Alamat baris ke-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Baris 2</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan Alamat baris ke-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kota <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama kota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tanggal Aktif <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="block w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="statusActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Status Aktif
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {field.value ? (
                            <span className="text-green-500">
                              Status Karyawan masih aktif
                            </span>
                          ) : (
                            <span className="text-red-500">
                              Resign/tidak Aktif
                            </span>
                          )}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(value) => {
                            console.log(
                              "Switch onCheckedChange called with:",
                              value
                            ); // Lihat nilai dari switch
                            field.onChange(value); // Langsung teruskan nilai
                            console.log(
                              "After field.onChange, field.value (might not be updated yet):",
                              field.value
                            ); // Nilai ini mungkin belum diperbarui
                          }}
                          disabled={mode !== "edit"}
                          // disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
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
                <span className="text-red-500"> (*)</span>
              </Badge>
            )}
            {mode === "edit" && !isDirty && (
              <Badge variant="outline" className="bg-gray-50">
                Belum ada perubahan
              </Badge>
            )}
            {mode === "edit" && isDirty && !isValid && (
              <Badge variant="outline" className="bg-red-50">
                Silakan lengkapi field yang diperlukan
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
                {mode === "create" ? "Simpan Driver" : "Update Driver"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
