import type { ComponentProps } from "react";
import "./bullet-hole.css";

/** A 264px torn hole, centred behind its parent, that opens onto the blue grid. The parent must be `relative isolate` and at least `size-66`. */
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
