import type { ComponentProps } from "react";
import "./bullet-hole.css";

/** A torn hole that tears open behind its parent, revealing the blue grid. The parent must be `relative isolate`. */
export function BulletHole({
  className = "",
  ...props
}: Omit<ComponentProps<"div">, "children">) {
  return (
    <div
      aria-hidden="true"
      className={`bullet-hole ${className}`}
      {...props}
    />
  );
}
