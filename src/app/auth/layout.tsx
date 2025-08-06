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
      <div className="hidden lg:flex w-full h-full justify-center items-center">
        <Image
          src="/simago-cover.jpg"
          alt="image bg"
          height={520}
          width={520}
          loading="lazy"
        />
      </div>
      <div className="flex justify-center mx-auto items-center max-w-md w-full">
        {children}
      </div>
    </section>
  );
}
