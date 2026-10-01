import type { ComponentProps } from "react";

export function Raking({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`raking ${className}`} {...props} />;
}
