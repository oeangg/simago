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
import { Loader2, Save, Car } from "lucide-react";
import { VehicleType } from "@prisma/client";

import {
  vehicleSchema,
  VehicleTypeSchema,
  VehicleUpdateSchema,
  vehicleUpdateSchema,
} from "@/schemas/vehicle";

interface VehicleFormProps {
  vehicle?: {
    id: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    vehicleMake?: string | null;
    vehicleYear?: string | null;
  };
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function untuk format nomor kendaraan
const formatVehicleNumber = (value: string): string => {
  // Remove all spaces and convert to uppercase
  const cleaned = value.replace(/\s/g, "").toUpperCase();

  // Extract letters and numbers
  const letters = cleaned.match(/[A-Z]+/g) || [];
  const numbers = cleaned.match(/\d+/g) || [];

  if (letters.length > 0 && numbers.length > 0) {
    // Format: LETTERS NUMBER (e.g., "B 1234 ABC" or "DK 123 AB")
    const firstLetters = letters[0];
    const firstNumbers = numbers[0];
    const remainingLetters = letters.slice(1).join("");

    if (remainingLetters) {
      return `${firstLetters} ${firstNumbers} ${remainingLetters}`;
    } else {
      return `${firstLetters} ${firstNumbers}`;
    }
  }

  return cleaned;
};

// Helper untuk generate tahun options
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= currentYear - 50; year--) {
    years.push(year.toString());
  }
  return years;
};

// Vehicle type options
const vehicleTypeOptions = [
  { value: "BOX", label: "Box" },
  { value: "TRUCK", label: "Truck" },
  { value: "WINGBOX", label: "Wing Box" },
  { value: "TRONTON", label: "Tronton" },
  { value: "TRAILER", label: "Trailer" },
  { value: "PICKUP", label: "Pickup" },
  { value: "VAN", label: "Van" },
];

type VehicleTypeFormData = VehicleTypeSchema | VehicleUpdateSchema;
// Type guard untuk check apakah data memiliki id (untuk update)
function isUpdateData(data: VehicleTypeSchema): data is VehicleUpdateSchema {
  return "id" in data;
}

export function VehicleForm({
  vehicle,
  mode,
  onSuccess,
  onCancel,
}: VehicleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: vehicleData,
    isLoading: isLoadingVehicle,
    isPending: isPendingVehicle,
  } = trpc.Vehicle.getVehicleById.useQuery(
    { id: vehicle?.id || "" },
    { enabled: mode === "edit" && !!vehicle?.id }
  );

  const getDefaultValues = useCallback((): VehicleTypeFormData => {
    if (mode === "edit" && vehicleData) {
      return {
        id: vehicleData.id,
        vehicleNumber: vehicleData.vehicleNumber,
        vehicleType: vehicleData.vehicleType,
        vehicleMake: vehicleData.vehicleMake || "",
        vehicleYear: vehicleData.vehicleYear || "",
      };
    }

    return {
      vehicleNumber: "",
      vehicleType: "BOX" as VehicleType,
      vehicleMake: "",
      vehicleYear: "",
    };
  }, [vehicleData, mode]);

  // Initialize form

  const resolver =
    mode === "create"
      ? (zodResolver(vehicleSchema) as Resolver<VehicleTypeSchema>)
      : (zodResolver(vehicleUpdateSchema) as Resolver<VehicleUpdateSchema>);

  const form = useForm<VehicleTypeSchema>({
    resolver: resolver as Resolver<VehicleTypeFormData>,
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Re-initialize form (edit mode)
  useEffect(() => {
    if (mode === "edit" && vehicleData && !isPendingVehicle) {
      form.reset(getDefaultValues());
    }
  }, [vehicleData, mode, isPendingVehicle, form, getDefaultValues]);

  // Get form state
  const { isDirty, isValid } = form.formState;

  // tRPC utils
  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.Vehicle.createVehicle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.Vehicle.getAllVehicle.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/kendaraan");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat data kendaraan");
    },
  });

  const updateMutation = trpc.Vehicle.updateVehicle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.Vehicle.getAllVehicle.invalidate();
      utils.Vehicle.getVehicleById.invalidate({ id: vehicle?.id });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/kendaraan");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui data kendaraan");
    },
  });

  // Submit handler
  const onSubmitVehicle = async (data: VehicleTypeSchema) => {
    setIsLoading(true);
    try {
      const submitData = data;

      if (mode === "create" && !isUpdateData(data)) {
        await createMutation.mutateAsync(submitData as VehicleTypeSchema);
      } else if (mode === "edit" && isUpdateData(data)) {
        await updateMutation.mutateAsync(submitData as VehicleUpdateSchema);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard/kendaraan");
    }
  };

  if (mode === "edit" && (isLoadingVehicle || isPendingVehicle)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitVehicle)} className="space-y-6">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Informasi Kendaraan
            </CardTitle>
            <CardDescription>
              Masukkan informasi dasar kendaraan
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vehicleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nomor Kendaraan <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: B 1234 ABC"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatVehicleNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipe Kendaraan <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe kendaraan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypeOptions.map((option) => (
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
                name="vehicleMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merek Kendaraan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Toyota, Mitsubishi, Hino"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Kendaraan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* <SelectItem value="None">-</SelectItem> */}
                        {generateYearOptions().map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
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
                {mode === "create" ? "Simpan Kendaraan" : "Update Kendaraan"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
