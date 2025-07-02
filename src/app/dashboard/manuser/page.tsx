import { IndexPageManUserDataTable } from "@/components/Featured/Dashboard/ManajemenUser/IndexPageDataTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <IndexPageManUserDataTable />;
}
