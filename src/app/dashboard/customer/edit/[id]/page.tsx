import { CustomerEditPage } from "@/components/Featured/Dashboard/Customer/CustomerEditPage";
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

  return <CustomerEditPage id={id} />;
}
