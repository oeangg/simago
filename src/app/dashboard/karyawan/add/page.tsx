import EmployeeAddPage from "@/components/Featured/Dashboard/Employee/EmployeeAddPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <EmployeeAddPage />;
}
