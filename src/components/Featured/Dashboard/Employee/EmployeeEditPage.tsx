"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { EmployeeForm } from "./EmployeeForm";

interface employeeEditPageProps {
  id: string;
}

export const EmployeeEditPage = ({ id }: employeeEditPageProps) => {
  const router = useRouter();
  const employeeId = id;

  const {
    data: employee,
    isLoading,
    error,
  } = trpc.Employee.getEmployeebyId.useQuery({ id: employeeId });

  const handleSuccess = () => {
    router.push("/dashboard/karyawan");
  };

  const handleCancel = () => {
    router.push("/dashboard/karyawan");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto ">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">
              Memuat data karyawan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto ">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                {error.message || "Gagal memuat data karyawan"}
              </p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Karyawan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Employee not found
  if (!employee) {
    return (
      <div className="container mx-auto ">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Karyawan tidak ditemukan</p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Karyawan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="container mx-auto max-w-4xl  space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Karyawan</h1>
          <p className="text-muted-foreground">
            Ubah data karyawan: {employee.name}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>

      {/* Form */}
      <EmployeeForm
        employee={employee}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};
