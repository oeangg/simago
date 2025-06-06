import Image from "next/image";
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
      </div>
      <div className="flex justify-center mx-auto items-center max-w-md w-full">
        {children}
      </div>
    </section>
  );
}
