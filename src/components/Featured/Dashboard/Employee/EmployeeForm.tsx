// components/forms/EmployeeForm.tsx
"use client";

import { useState, useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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

interface EmployeeFormProps {
  employee?: {
    id: string;
    nik: string;
    name: string;
    isActive: boolean;
    gender: Gender;
    address: string;
    city: string;
    zipcode: string;
    photo?: string | null;

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

export function EmployeeForm({
  employee,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!employee;

  const { data: positions = [], refetch: refetchPositions } =
    trpc.Position.getAllPositions.useQuery();

  const form = useForm<employeeTypeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nik: employee?.nik || "",
      name: employee?.name || "",
      isActive: employee?.isActive ?? false,
      gender: employee?.gender || undefined,
      address: employee?.address || "",
      city: employee?.city || "",
      zipcode: employee?.zipcode || "",
      photo: employee?.photo || "",

      phoneNumber: employee?.phoneNumber || "",
      employments:
        employee?.employments?.map((emp) => ({
          id: emp.id,
          startDate: emp.startDate ? emp.startDate.slice(0, 10) : "",
          endDate: emp.endDate ? emp.endDate.slice(0, 10) : "",
          positionId: emp.positionId,
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

  const addEmployment = useCallback(() => {
    append({
      startDate: "",
      endDate: "",
      positionId: "",
    });
  }, [append]);

  const removeEmployment = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const onSubmit = useCallback(
    async (data: employeeTypeSchema) => {
      try {
        const processedData = {
          ...data,
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

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["Employee"] });
        queryClient.invalidateQueries({ queryKey: ["Employment"] });

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
      queryClient,
      onSuccess,
    ]
  );

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmLeave = confirm(
        "Ada perubahan yang belum disimpan. Yakin ingin keluar?"
      );
      if (!confirmLeave) return;
    }

    reset();
    onCancel?.();
  }, [isDirty, reset, onCancel]);

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Employee Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <FormField
                  control={control}
                  name="nik"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIK *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan NIK"
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap *</FormLabel>
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
                      <FormLabel>Jenis Kelamin *</FormLabel>
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
                      <FormLabel>Nomor HP *</FormLabel>
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
                      <FormLabel>Kota *</FormLabel>
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
                      <FormLabel>Kode Pos *</FormLabel>
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
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Foto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan URL foto"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan alamat lengkap"
                        className="resize-none"
                        rows={3}
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Status karyawan masih aktif/resign
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Employment Information */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Riwayat Pekerjaan
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
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={control}
                          name={`employments.${index}.positionId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Posisi *</FormLabel>
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

                        <FormField
                          control={control}
                          name={`employments.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tanggal Mulai *</FormLabel>
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
