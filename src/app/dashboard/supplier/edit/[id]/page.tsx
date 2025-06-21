import { SupplierEditPage } from "@/components/Featured/Dashboard/Supplier/SupplierEditPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SupplierEditPage id={id} />;
}
