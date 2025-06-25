import { DriverUpdateDataTable } from "@/components/Featured/Dashboard/Driver/UpdateDataTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <DriverUpdateDataTable />;
}
