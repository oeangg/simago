import { RegisterForm } from "@/components/featured/auth/auth-registerForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Account",
};

export default function Home() {
  return <RegisterForm />;
}
