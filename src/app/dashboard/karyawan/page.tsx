import { UpdateDataTable } from "@/components/featured/dashboard/karyawan/update-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <UpdateDataTable />;
}
