import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  knightsKnavesAttemptRoles,
  knightsKnavesCharacters,
  knightsKnavesPuzzles,
  knightsKnavesStatements,
} from "./tables";

const MIN_CHARACTERS = 2;
const MAX_CHARACTERS = 5;

const puzzleInsert = createInsertSchema(knightsKnavesPuzzles);
const characterSelect = createSelectSchema(knightsKnavesCharacters);
const characterInsert = createInsertSchema(knightsKnavesCharacters);
const statementSelect = createSelectSchema(knightsKnavesStatements);
const statementInsert = createInsertSchema(knightsKnavesStatements);
const roleSelect = createSelectSchema(knightsKnavesAttemptRoles);

const role = characterSelect.shape.role;
const assignment = z.object({
  position: characterSelect.shape.position,
  role,
});

/** Names and what each one says. The roles are (S) and stay on the server. */
export const payloadSchema = z
  .object({
    ...puzzleInsert.pick({ questionText: true }).shape,
    characters: z.array(
      z
        .object({
          ...characterSelect.pick({ position: true, name: true }).shape,
          statements: z.array(statementSelect.shape.content),
        })
        .strict(),
    ),
  })
  .strict();

export const solutionSchema = z.array(assignment);

/** The role the player chose for every character. */
export const answerSchema = z.object({
  roles: z.array(assignment).min(MIN_CHARACTERS).max(MAX_CHARACTERS),
});

export const attemptSchema = z.object({
  roles: z.array(
    z.object({
      position: roleSelect.shape.characterPosition,
      role: roleSelect.shape.role,
    }),
  ),
});

const who = characterInsert.shape.name;

const atomSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("is"), who, role }),
  z.object({ kind: z.literal("same"), a: who, b: who }),
  z.object({ kind: z.literal("different"), a: who, b: who }),
]);

/**
 * What a statement asserts, as data for the solver. Authoring metadata for `puzzles:verify`, never stored:
 * the player only ever sees the statement text. `atLeast` and `exactly` count the characters of one role.
 */
export const claimSchema = z.discriminatedUnion("kind", [
  ...atomSchema.options,
  z.object({ kind: z.literal("all"), of: z.array(atomSchema).min(2) }),
  z.object({ kind: z.literal("any"), of: z.array(atomSchema).min(2) }),
  z.object({
    kind: z.literal("atLeast"),
    role,
    n: z.number().int().min(1).max(MAX_CHARACTERS),
  }),
  z.object({
    kind: z.literal("exactly"),
    role,
    n: z.number().int().min(0).max(MAX_CHARACTERS),
  }),
]);

/** The characters are in speaking order; `role` is the stored solution and `claim` encodes each statement for the solver. */
export const contentSchema = z.object({
  ...puzzleInsert.pick({ questionText: true }).shape,
  characters: z
    .array(
      z.object({
        name: who,
        role,
        statements: z
          .array(
            z.object({
              content: statementInsert.shape.content,
              claim: claimSchema,
            }),
          )
          .min(1),
      }),
    )
    .min(MIN_CHARACTERS)
    .max(MAX_CHARACTERS),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type Role = z.infer<typeof role>;
