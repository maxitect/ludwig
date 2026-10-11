import "server-only";

/** Emails can't use CSS variables, so the design-token values are repeated here once. */
export const EMAIL_COLOURS = {
  paper: "#E9E4DE",
  ink: "#0A0B0D",
  crayon: "#8B2020",
} as const;
