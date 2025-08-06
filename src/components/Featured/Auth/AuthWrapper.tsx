import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import React from "react";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter } from "./AuthFooter";

interface cardAuthWrapperProps {
  titleHeader: string;
  descHeader: string;
  labelFooter: string;
  hrefFooter: string;
  descFooter: string;
  children: React.ReactNode;
}

export const CardAuthWrapper = ({
  titleHeader,
  descHeader,
  descFooter,
  labelFooter,
  hrefFooter,
  children,
}: cardAuthWrapperProps) => {
  return (
    <Card className="w-full px-5 py-2 shadow-2xl">
      <CardHeader>
        <AuthHeader titleHeader={titleHeader} descHeader={descHeader} />
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <AuthFooter
          labelFooter={labelFooter}
          hrefFooter={hrefFooter}
          descFooter={descFooter}
        />
      </CardFooter>
    </Card>
  );
};
