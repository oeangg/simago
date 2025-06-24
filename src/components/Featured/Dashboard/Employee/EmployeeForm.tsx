// components/forms/EmployeeForm.tsx
"use client";

import { useState, useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  Calendar,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  User,
  FileSignature,
} from "lucide-react";
import { employeeSchema, employeeTypeSchema } from "@/schemas/employeeSchema";
import { Gender } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface EmployeeFormProps {
  employee?: {
    id: string;
    nik: string;
    name: string;
    isActive: boolean;
    activeDate: string;
    gender: Gender;
    address: string;
    city: string;
    zipcode: string;
    photo?: string | null;
    ttdDigital?: string | null;
    resignDate?: string | null;
    phoneNumber: string;
    employments: Array<{
      id: string;
      startDate: string;
      endDate?: string | null;
      positionId: string;
      position: {
        id: string;
        name: string;
      };
      divisionId: string;
      division: {
        id: string;
        name: string;
      };
    }>;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Position Add Dialog Component
function AddPositionDialog({
  onPositionAdded,
}: {
  onPositionAdded: (position: { id: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  // Separate form for position dialog
  const positionForm = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  const { mutateAsync: createPosition, isPending: isCreatingPosition } =
    trpc.Position.createPosition.useMutation();

  const handleSubmit = useCallback(
    async (data: { name: string }) => {
      if (!data.name.trim()) return;

      try {
        const result = await createPosition({ name: data.name.trim() });
        onPositionAdded(result.data);
        toast.success(result.message);
        positionForm.reset();
        setOpen(false);
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Gagal menambahkan posisi");
        }
      }
    },
    [createPosition, onPositionAdded, positionForm]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Posisi Baru</DialogTitle>
          <DialogDescription>
            Tambahkan posisi/jabatan baru untuk karyawan.
          </DialogDescription>
        </DialogHeader>
        <Form {...positionForm}>
          <form onSubmit={positionForm.handleSubmit(handleSubmit)}>
            <div className="py-4">
              <FormField
                control={positionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex w-full flex-row items-center gap-4">
                      <FormLabel className="w-[150px] text-right">
                        Nama Posisi
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="flex-1"
                          placeholder="Contoh: Manager, Staff, dll"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  positionForm.reset();
                }}
                disabled={isCreatingPosition}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  isCreatingPosition || !positionForm.watch("name")?.trim()
                }
              >
                {isCreatingPosition ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Divison Add Dialog Component
function AddDivisionDialog({
  onDivisionAdded,
}: {
  onDivisionAdded: (division: { id: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  // Separate form for division dialog
  const divisionForm = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  const { mutateAsync: createDivision, isPending: isCreatingDivision } =
    trpc.Division.createDivision.useMutation();

  const handleSubmitDivision = useCallback(
    async (data: { name: string }) => {
      if (!data.name.trim()) return;

      try {
        const result = await createDivision({ name: data.name.trim() });
        onDivisionAdded(result.data);
        toast.success(result.message);
        divisionForm.reset();
        setOpen(false);
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Gagal menambahkan divisi");
        }
      }
    },
    [createDivision, onDivisionAdded, divisionForm]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Divisi Baru</DialogTitle>
          <DialogDescription>
            Tambahkan divisi/departemen baru untuk karyawan.
          </DialogDescription>
        </DialogHeader>
        <Form {...divisionForm}>
          <form onSubmit={divisionForm.handleSubmit(handleSubmitDivision)}>
            <div className="py-4">
              <FormField
                control={divisionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex w-full flex-row items-center gap-4">
                      <FormLabel className="w-[150px] text-right">
                        Nama Divisi
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="flex-1 uppercase placeholder:lowercase"
                          placeholder="Contoh: Marketing, Operational, dll"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  divisionForm.reset();
                }}
                disabled={isCreatingDivision}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  isCreatingDivision || !divisionForm.watch("name")?.trim()
                }
              >
                {isCreatingDivision ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeForm({
  employee,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const isEdit = !!employee;
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    employee?.photo || null
  );
  const [ttdPreview, setTtdPreview] = useState<string | null>(
    employee?.ttdDigital || null
  );

  const { data: positions = [], refetch: refetchPositions } =
    trpc.Position.getAllPositions.useQuery();
  const { data: divisions = [], refetch: refetcDivisions } =
    trpc.Division.getAllDivision.useQuery();

  const form = useForm<employeeTypeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nik: employee?.nik || "",
      name: employee?.name || "",
      isActive: employee?.isActive ?? true,
      activeDate: employee?.activeDate ? employee.activeDate?.slice(0, 10) : "",
      gender: employee?.gender || undefined,
      address: employee?.address || "",
      city: employee?.city || "",
      zipcode: employee?.zipcode || "",
      photo: employee?.photo || "",
      ttdDigital: employee?.ttdDigital || "",
      resignDate: employee?.resignDate ? employee.resignDate.slice(0, 10) : "",
      phoneNumber: employee?.phoneNumber || "",
      employments:
        employee?.employments?.map((emp) => ({
          id: emp.id,
          startDate: emp.startDate ? emp.startDate.slice(0, 10) : "",
          endDate: emp.endDate ? emp.endDate.slice(0, 10) : "",
          positionId: emp.positionId,
          divisionId: emp.divisionId,
        })) || [],
    },
    mode: "onChange", // Enable real-time validation
  });

  const { control, formState, handleSubmit, getValues, reset, setValue } = form;
  const isDirty = formState.isDirty;
  const isValid = formState.isValid;

  // tRPC mutations
  const { mutateAsync: createEmployee, isPending: isCreating } =
    trpc.Employee.createFullEmployee.useMutation();

  const { mutateAsync: updateEmployee, isPending: isUpdating } =
    trpc.Employee.updateFullEmployee.useMutation();

  const isSubmitting = isCreating || isUpdating;

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "employments",
  });

  const handleAddPosition = useCallback(
    (newPosition: { id: string; name: string }) => {
      refetchPositions();

      const lastIndex = fields.length - 1;
      if (lastIndex >= 0 && !getValues(`employments.${lastIndex}.positionId`)) {
        setValue(`employments.${lastIndex}.positionId`, newPosition.id);
      }
    },
    [refetchPositions, fields.length, getValues, setValue]
  );

  const handleAddDivision = useCallback(
    (newDivision: { id: string; name: string }) => {
      refetcDivisions();

      const lastIndex = fields.length - 1;
      if (lastIndex >= 0 && !getValues(`employments.${lastIndex}.divisionId`)) {
        setValue(`employments.${lastIndex}.divisionId`, newDivision.id);
      }
    },
    [refetcDivisions, fields.length, getValues, setValue]
  );

  // Handle file upload for photo
  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        alert("Fitur Coming Soon...");
      }
    },
    []
  );

  // Handle file upload for TTD
  const handleTtdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        alert("Fitur Coming Soon...");
      }
    },
    []
  );

  const removePhoto = useCallback(() => {
    setPhotoPreview(null);
    setValue("photo", "");
  }, [setValue]);

  const removeTtd = useCallback(() => {
    setTtdPreview(null);
    setValue("ttdDigital", "");
  }, [setValue]);

  const addEmployment = useCallback(() => {
    append({
      startDate: "",
      endDate: "",
      positionId: "",
      divisionId: "",
    });
  }, [append]);

  const removeEmployment = useCallback(
    (index: number) => {
      // Tidak boleh menghapus jika hanya ada 1 employment
      if (fields.length <= 1) {
        toast.error("Minimal harus ada 1 riwayat pekerjaan");
        return;
      }
      remove(index);
    },
    [remove, fields.length]
  );

  const utils = trpc.useUtils();

  const onSubmitEmployee = useCallback(
    async (data: employeeTypeSchema) => {
      try {
        const processedData = {
          ...data,
          activeDate: new Date(data.activeDate).toISOString(),
          employment: data.employments?.map((emp) => ({
            ...emp,
            startDate: new Date(emp.startDate).toISOString(),
            endDate: emp.endDate
              ? new Date(emp.endDate).toISOString()
              : undefined,
          })),
        };

        let result;
        if (isEdit && employee) {
          result = await updateEmployee({
            id: employee.id,
            ...processedData,
          });
        } else {
          result = await createEmployee(processedData);
          form.reset(); // Reset form only for new employee creation
        }

        toast.success(result.message);

        utils.Employee.invalidate();
        // Invalidate queries
        // queryClient.invalidateQueries({ queryKey: ["Employee"] });
        // queryClient.invalidateQueries({ queryKey: ["Employment"] });

        onSuccess?.();
      } catch (error: unknown) {
        console.error("Form submission error:", error);

        if (error instanceof TRPCError) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Telah terjadi kesalahan");
        }
      }
    },
    [
      isEdit,
      employee,
      createEmployee,
      updateEmployee,
      form,
      onSuccess,
      utils.Employee,
    ]
  );

  const handleCancel = useCallback(() => {
    // if (isDirty) {
    //   const confirmLeave = confirm(
    //     "Ada perubahan yang belum disimpan. Yakin ingin keluar?"
    //   );
    //   if (!confirmLeave) return;
    // }

    reset();
    onCancel?.();
  }, [reset, onCancel]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEdit ? "Edit Karyawan" : "Tambah Karyawan Baru"}
          {isDirty && (
            <span className="text-sm font-normal text-orange-600">
              (Belum disimpan)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmitEmployee)} className="space-y-8">
            {/* Basic Employee Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <FormField
                  control={control}
                  name="nik"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        NIK <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex : NIK-1122"
                          {...field}
                          disabled={isEdit ? true : isSubmitting}
                          className=" uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Lengkap <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan nama lengkap"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Jenis Kelamin <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Laki-laki</SelectItem>
                          <SelectItem value="FEMALE">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nomor HP <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan nomor HP"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kota <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan kota"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kode Pos <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan kode pos"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Alamat <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan alamat lengkap"
                          className="resize-none"
                          rows={4}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="activeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tanggal Masuk <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isSubmitting}
                          placeholder="Pilih tanggal masuk"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photo Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="photo"
                  render={() => (
                    <FormItem>
                      <FormLabel>Foto Karyawan</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="photo-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              {photoPreview ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={photoPreview}
                                    alt="Preview foto"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <User className="w-8 h-8 mb-4 text-gray-500" />
                                  <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">
                                      Klik untuk upload
                                    </span>{" "}
                                    foto
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    PNG, JPG (MAX. 5MB)
                                  </p>
                                </div>
                              )}
                              <input
                                id="photo-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                disabled={isSubmitting}
                              />
                            </label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TTD Digital Upload */}
                <FormField
                  control={control}
                  name="ttdDigital"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tanda Tangan Digital</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="ttd-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              {ttdPreview ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={ttdPreview}
                                    alt="Preview TTD"
                                    className="w-full h-full object-contain rounded-lg bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={removeTtd}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <FileSignature className="w-8 h-8 mb-4 text-gray-500" />
                                  <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">
                                      Klik untuk upload
                                    </span>{" "}
                                    TTD
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    PNG, JPG (MAX. 5MB)
                                  </p>
                                </div>
                              )}
                              <input
                                id="ttd-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleTtdChange}
                                disabled={isSubmitting}
                              />
                            </label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status Active and Resign Date - Only for Edit */}

              {/* Status Active and Resign Date - Only for Edit */}
              {isEdit && (
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="isActive"
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
                            onCheckedChange={field.onChange}
                            disabled
                            // disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Resign Date - hanya muncul jika isActive = false */}
                  {!form.watch("isActive") && (
                    <FormField
                      control={control}
                      name="resignDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Tanggal Resign{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={isSubmitting}
                              placeholder="Pilih tanggal resign"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Employment Information */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Riwayat Pekerjaan
                  <span className="text-red-500">*</span>
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmployment}
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pekerjaan
                </Button>
              </div>

              {/* Field error untuk employments */}
              {formState.errors.employments && (
                <div className="text-sm text-red-500 mt-1">
                  {formState.errors.employments.message}
                </div>
              )}

              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada riwayat pekerjaan</p>
                  <p className="text-sm">
                    Klik Tambah Pekerjaan untuk menambahkan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Pekerjaan #{index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmployment(index)}
                          className="text-destructive hover:text-destructive"
                          disabled={isSubmitting || fields.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        <div className="grid grid-cols-2 col-span-4 gap-2">
                          <FormField
                            control={control}
                            name={`employments.${index}.divisionId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Divisi <span className="text-red-500">*</span>
                                </FormLabel>
                                <div className="flex gap-2">
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isSubmitting}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Pilih Divisi" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {divisions.map((divisi) => (
                                        <SelectItem
                                          key={divisi.id}
                                          value={divisi.id}
                                        >
                                          {divisi.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <AddDivisionDialog
                                    onDivisionAdded={handleAddDivision}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`employments.${index}.positionId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Posisi <span className="text-red-500">*</span>
                                </FormLabel>
                                <div className="flex gap-2">
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isSubmitting}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Pilih posisi" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {positions.map((position) => (
                                        <SelectItem
                                          key={position.id}
                                          value={position.id}
                                        >
                                          {position.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <AddPositionDialog
                                    onPositionAdded={handleAddPosition}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={control}
                          name={`employments.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Tanggal Mulai{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name={`employments.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tanggal Selesai</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEdit ? "Update" : "Simpan"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
