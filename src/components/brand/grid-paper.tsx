import type { ComponentProps } from "react";

export function GridPaper({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`grid-paper ${className}`} {...props} />;
}
