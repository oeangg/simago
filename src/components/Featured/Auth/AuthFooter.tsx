import React from "react";
import Link from "next/link";

interface authFooterProps {
  labelFooter: string;
  hrefFooter: string;
  descFooter: string;
}

export const AuthFooter = ({
  hrefFooter,
  labelFooter,
  descFooter,
}: authFooterProps) => {
  return (
    <div className="flex justify-center">
      <span className="text-xs font-light tracking-tight">
        {descFooter}{" "}
        <Link href={hrefFooter} className="font-medium">
          {labelFooter}
        </Link>
      </span>
    </div>
  );
};
