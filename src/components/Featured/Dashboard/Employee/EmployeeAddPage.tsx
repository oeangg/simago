"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { EmployeeForm } from "./EmployeeForm";

export default function EmployeeAddPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/karyawan");
  };

  const handleCancel = () => {
    router.push("/dashboard/karyawan");
  };

  return (
    <div className="container mx-auto max-w-4xl  space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Karyawan</h1>
          <p className="text-muted-foreground">
            Tambah data karyawan baru ke sistem
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
      </div>

      {/* Form */}
      <EmployeeForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
