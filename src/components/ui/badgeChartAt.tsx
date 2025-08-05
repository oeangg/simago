import React from "react";

interface BadgeChartAtProps {
  children?: React.ReactNode;
}

export const BadgeChartAt = ({ children }: BadgeChartAtProps) => {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
      {children}
    </div>
  );
};
