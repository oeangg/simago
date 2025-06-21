"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { SupplierForm } from "./SupplierForm";

export const SupplierAddPage = () => {
  const router = useRouter();
  const handleCancel = () => {
    router.push("/dashboard/supplier");
  };
  return (
    <div className="container  max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Supplier</h1>
          <p className="text-muted-foreground">
            Buat Supplier baru dengan informasi lengkap
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      {/* Form */}
      <SupplierForm mode="create" />
    </div>
  );
};
