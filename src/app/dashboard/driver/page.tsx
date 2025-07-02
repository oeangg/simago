import { IndexPageDriverDataTable } from "@/components/Featured/Dashboard/Driver/IndexPageDataTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <IndexPageDriverDataTable />;
}
