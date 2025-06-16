import { UpdateDataTable } from "@/components/Featured/Dashboard/ManajemenUser/UpdateTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <UpdateDataTable />;
}
