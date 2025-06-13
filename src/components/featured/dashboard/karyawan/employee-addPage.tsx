"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EmployeeForm } from "./employee-form";

export default function EmployeeAddPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/karyawan");
  };

  const handleCancel = () => {
    router.push("/dashboard/karyawan");
  };

  return (
    <div className="container mx-auto  space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex  items-center  space-x-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tambah Karyawan</h1>
            <p className="text-gray-600 mt-1">
              Tambah data karyawan baru ke sistem
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <EmployeeForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
