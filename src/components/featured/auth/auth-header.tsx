import Image from "next/image";
import React from "react";

interface authHeaderProps {
  titleHeader: string;
  descHeader: string;
}

export const AuthHeader = ({ descHeader, titleHeader }: authHeaderProps) => {
  return (
    <div className="w-full  flex flex-col items-center gap-4  justify-center ">
      <Image src="/logo/logo.PNG" alt="logo" width={100} height={60} />
      <div className="text-center -space-y-0.5">
        <h2 className="text-2xl font-bold tracking-wide ">{titleHeader}</h2>
        <p className="text-xs font-normal tracking-tight">{descHeader}</p>
      </div>
    </div>
  );
};
