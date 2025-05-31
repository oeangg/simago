import { Button } from "@/components/ui/button";
import { ArrowUpLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="w-full h-svh grid grid-cols-1 lg:grid-cols-2 place-items-center">
      {/* <div className="w-full grid grid-cols-1 md:grid-cols-2"> */}
      <div className="hidden lg:flex w-full h-full relative ">
        <Image src="/delivery.jpg" alt="image bg" fill />
        <Button
          variant="ghost"
          asChild
          className="absolute top-10 text-red-500  left-10"
        >
          <Link href="/">
            <ArrowUpLeft />
            Back to Home
          </Link>
        </Button>
      </div>
      <div className="flex justify-center mx-auto items-center min-w-96">
        {children}
      </div>
    </section>
  );
}
