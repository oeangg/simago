import { LoginForm } from "@/components/Featured/Auth/AuthLoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Please login use your Account",
};

export default function Home() {
  return <LoginForm />;
}
