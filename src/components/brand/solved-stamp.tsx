"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { useReduceMotion } from "@/utils/use-reduce-motion";

type SolvedStampProps = Omit<
  ComponentProps<"div">,
  "children" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> & { delay?: number };

export function SolvedStamp({
  className = "",
  delay = 0,
  ...props
}: SolvedStampProps) {
  const reduceMotion = useReduceMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.3, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 18, delay }
      }
      className={`block w-fit border-4 border-ludwig-red px-4 py-1 font-signature text-6xl text-ludwig-red ${className}`}
      {...props}
    >
      Solved.
    </motion.div>
  );
}
