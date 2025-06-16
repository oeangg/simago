import { RegisterForm } from "@/components/Featured/Auth/AuthRegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <RegisterForm />;
}
