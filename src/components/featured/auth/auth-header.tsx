import React from "react";

interface authHeaderProps {
  titleHeader: string;
  descHeader: string;
}

export const AuthHeader = ({ descHeader, titleHeader }: authHeaderProps) => {
  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold tracking-wide">{titleHeader}</h2>
      <p className="text-sm font-light tracking-tight">{descHeader}</p>
    </div>
  );
};
