import type { ComponentProps } from "react";

type CreditProps = Omit<ComponentProps<"h2">, "children"> & {
  top: string;
  bottom: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function Credit({
  top,
  bottom,
  level = 2,
  className = "",
  ...props
}: CreditProps) {
  const Heading = `h${level}` as const;

  return (
    <Heading
      className={`font-display uppercase tracking-[0.04em] ${className}`}
      {...props}
    >
      <span className="block font-display text-lg font-light uppercase">
        {top}
      </span>
      <span className="block font-display text-5xl font-bold uppercase">
        {bottom}
      </span>
    </Heading>
  );
}
