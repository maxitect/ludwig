"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

type SolvedStampProps = Omit<
  ComponentProps<"div">,
  "children" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

export function SolvedStamp({ className = "", ...props }: SolvedStampProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 18 }
      }
      className={`block w-fit border-4 border-ludwig-red px-4 py-1 font-signature text-6xl text-ludwig-red ${className}`}
      {...props}
    >
      Solved.
    </motion.div>
  );
}
