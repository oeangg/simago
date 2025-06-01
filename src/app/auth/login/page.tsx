import { LoginForm } from "@/components/featured/auth/auth-loginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Please login use your Account",
};

export default function Home() {
  return <LoginForm />;
}
