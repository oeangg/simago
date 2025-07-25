import { VehicleEditPage } from "@/components/Featured/Dashboard/Vehicle/VehicleEditPage";
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

  return <VehicleEditPage id={id} />;
}
