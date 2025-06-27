"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { VehicleForm } from "./VehicleForm";

export const VehicleAddPage = () => {
  const router = useRouter();
  const handleCancel = () => {
    router.push("/dashboard/kendaraan");
  };
  return (
    <div className="container  max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Kendaraan</h1>
          <p className="text-muted-foreground">
            Buat data Kendaraan baru dengan informasi lengkap
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>
      {/* Form */}
      <VehicleForm mode="create" />
    </div>
  );
};
