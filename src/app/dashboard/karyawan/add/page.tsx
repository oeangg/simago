import EmployeeAddPage from "@/components/featured/dashboard/karyawan/employee-addPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <EmployeeAddPage />;
}
