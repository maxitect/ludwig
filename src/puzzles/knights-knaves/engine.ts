import type { Claim, Content, Role } from "./schema";

type Speaker = Pick<Content["characters"][number], "name"> & {
  statements: { claim: Claim }[];
};

/** Whether `claim` is true when character `i` holds `roles[i]`. Every part is evaluated, so it throws on any name that is not a character. */
export function holds(
  names: readonly string[],
  roles: readonly Role[],
  claim: Claim,
): boolean {
  const roleOf = (name: string) => {
    const index = names.indexOf(name);
    if (index < 0) throw new Error(`unknown character "${name}"`);
    return roles[index];
  };
  switch (claim.kind) {
    case "is":
      return roleOf(claim.who) === claim.role;
    case "same":
      return roleOf(claim.a) === roleOf(claim.b);
    case "different":
      return roleOf(claim.a) !== roleOf(claim.b);
    case "all":
      return claim.of.map((part) => holds(names, roles, part)).every(Boolean);
    case "any":
      return claim.of.map((part) => holds(names, roles, part)).some(Boolean);
    case "atLeast":
      return roles.filter((value) => value === claim.role).length >= claim.n;
    case "exactly":
      return roles.filter((value) => value === claim.role).length === claim.n;
  }
}

/** A knight's statements are all true and a knave's are all false. */
export function consistent(
  characters: readonly Speaker[],
  roles: readonly Role[],
) {
  const names = characters.map(({ name }) => name);
  return characters.every(({ statements }, i) =>
    statements.every(
      ({ claim }) => holds(names, roles, claim) === (roles[i] === "knight"),
    ),
  );
}

/** Every consistent role assignment, found by trying all 2^n of them. Stops after `limit`. */
export function solve(characters: readonly Speaker[], limit = Infinity) {
  const found: Role[][] = [];
  for (let mask = 0; mask < 2 ** characters.length; mask++) {
    const roles = characters.map(
      (_, i): Role => ((mask >> i) & 1 ? "knave" : "knight"),
    );
    if (consistent(characters, roles)) {
      found.push(roles);
      if (found.length >= limit) break;
    }
  }
  return found;
}
