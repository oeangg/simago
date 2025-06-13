import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import React from "react";

export default function Home() {
  return (
    <div>
      {" "}
      <Alert>
        <Info className="h-5 w-5" />
        <AlertTitle className="uppercase">Selamat datang kembali!</AlertTitle>
        <AlertDescription>
          Halo Selamat datang kembali di Simago! Sytem Informasi Cargo. Jika ada
          masalah silahkan hubungi Admin/Contact Support!
        </AlertDescription>
      </Alert>
    </div>
  );
}
