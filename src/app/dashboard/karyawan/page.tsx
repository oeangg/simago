import { IndexPageEmployeeDataTable } from "@/components/Featured/Dashboard/Employee/IndexPageDataTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <IndexPageEmployeeDataTable />;
}
