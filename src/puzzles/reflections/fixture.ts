import { content } from "../../../content/reflections/shop-window";
import { solve } from "./engine";
import type { Payload, Solution } from "./schema";

/** A puzzle with exactly one solution. */
export const payload: Payload = content;

export const solution: Solution = solve(content) ?? [];
