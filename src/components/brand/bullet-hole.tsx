import type { ComponentProps } from "react";
import "./bullet-hole.css";

/** A torn hole that fills its parent and opens onto the blue grid. The parent must be `relative isolate`, square, and sized by `--hole-size` (an odd number of 24px cells). */
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
