"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { CustomerForm } from "./CustomerForm";

interface customerEditPageProps {
  id: string;
}

export const CustomerEditPage = ({ id }: customerEditPageProps) => {
  const router = useRouter();
  const customerId = id;

  const {
    data: dataCustomer,
    isLoading,
    refetch: refetchDataCustomer,
    error,
  } = trpc.Customer.getCustomer.useQuery({ id: customerId });

  const handleSuccess = () => {
    router.push("/dashboard/customer");
  };

  const handleCancel = () => {
    router.push("/dashboard/customer");
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

  if (error) {
    console.error("Customer fetch error:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
          <p className="text-destructive mb-4 text-sm">
            {error.message || "Terjadi kesalahan saat memuat data customer"}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetchDataCustomer()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Employee not found
  if (!dataCustomer) {
    return (
      <div className="container mx-auto ">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Customer tidak ditemukan</p>
              <Button onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="container  max-w-4xl mx-auto  space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Customer :{" "}
            <span className="text-xl text-muted-foreground uppercase  font-medium">
              {dataCustomer.name}
            </span>
          </h1>
          <p className="text-muted-foreground">Perbarui informasi customer</p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      {/* Form */}
      <CustomerForm
        customer={dataCustomer}
        mode="edit"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};
