// components/forms/EmployeeForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner"; // or your preferred toast library

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
import { Loader2, Save, X } from "lucide-react";
import {
  EmployeeFormSchema,
  EmployeeFormSchemaType,
} from "@/schemas/employee-schema";
import { Gender } from "@prisma/client";
import { TRPCError } from "@trpc/server";

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
    telNumber?: string | null;
    phoneNumber: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmployeeForm({
  employee,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = !!employee;

  const form = useForm<EmployeeFormSchemaType>({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      nik: employee?.nik || "",
      name: employee?.name || "",
      isActive: employee?.isActive || false,
      gender: employee?.gender || undefined,
      address: employee?.address || "",
      city: employee?.city || "",
      zipcode: employee?.zipcode || "",
      photo: employee?.photo || "",
      telNumber: employee?.telNumber || "",
      phoneNumber: employee?.phoneNumber || "",
    },
  });

  // tRPC mutations
  const { mutateAsync: createEmployee } =
    trpc.Employee.createEmployee.useMutation();

  const { mutateAsync: updateEmployee } =
    trpc.Employee.updateEmployee.useMutation();

  const onSubmit = async (data: EmployeeFormSchemaType) => {
    setIsSubmitting(true);

    try {
      if (isEdit && employee) {
        const result = await updateEmployee({
          id: employee.id,
          ...data,
        });
        toast.success(result.message);
        form.reset();
      } else {
        const result = await createEmployee(data);
        toast.success(result.message);
      }
      queryClient.invalidateQueries({ queryKey: ["Employee"] });
      onSuccess?.();
    } catch (error: unknown) {
      if (error instanceof TRPCError) {
        toast.error(error.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Telah terjadi kesalahan");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? "Edit Karyawan" : "Tambah Karyawan Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan NIK" {...field} />
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
                    <FormLabel>Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nomor HP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nomor telepon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kota *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan kota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Pos *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan kode pos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Foto</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan URL foto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
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
