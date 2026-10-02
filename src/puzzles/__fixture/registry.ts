import type { PuzzleRegistry } from "../registry";
import { fixtureModule } from "./module";

export const registry: PuzzleRegistry = { [fixtureModule.meta.key]: fixtureModule };
