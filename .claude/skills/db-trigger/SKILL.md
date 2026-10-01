---
name: db-trigger
description: Write PostgreSQL trigger functions, constraint triggers and custom Drizzle migrations for this project (plain Postgres on Neon, no RLS). Use when adding a fill trigger for controlled redundancy, a deferred integrity check, or any other trigger.
---

# Database Trigger Skill

Use this skill for any trigger function or migration that contains one. The database runs plain PostgreSQL 17: Docker locally, Neon in production. There is no Supabase, no RLS and no `anon` or `authenticated` roles. The app connects as the database owner role.

Triggers exist in this project for exactly two reasons:

1. **Fill triggers.** They keep a controlled-redundancy column consistent so app code never supplies it. Every one is listed in `docs/SPEC.md` section 7.4.5.
2. **Integrity triggers.** They enforce rules that FKs and CHECKs can't express, e.g. "every puzzle has a subtype row" or "exactly one driver gear".

If a trigger would implement business logic or side effects (stats, notifications), stop. That belongs in app code, or it is derived data that shouldn't be stored at all.

---

## 1. Create the migration

Triggers are not expressible in the Drizzle schema, so use a custom migration:

```bash
pnpm drizzle-kit generate --custom --name=<concern>   # e.g. attempts_fill_type_key
```

- Write one concern per migration.
- The migration must run **after** the migration that creates the tables it touches. Generate the table migration first.

---

## 2. Function template

```sql
CREATE OR REPLACE FUNCTION public.trg_<descriptive_name>()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  -- fully-qualified references only: public.table_name
  RETURN NEW;
END;
$$;
```

- `SET search_path TO ''` is required on every function. Qualify every table and function, e.g. `public.puzzles` and `pg_catalog.format`.
- Use `SECURITY INVOKER` (the default). There is no RLS to bypass, so never use `SECURITY DEFINER`.
- Prefix both the function and the trigger with `trg_`. The name describes the guarantee, e.g. `trg_attempts_fill_type_key` or `trg_puzzles_require_subtype`.
- A trigger function can't be called outside a trigger, so no `GRANT` or `REVOKE` is needed.

---

## 3. Patterns

### Fill trigger (controlled redundancy)

```sql
CREATE OR REPLACE FUNCTION public.trg_attempts_fill_type_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  SELECT p.type_key INTO NEW.type_key
  FROM public.puzzles p
  WHERE p.id = NEW.puzzle_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attempts_fill_type_key
  BEFORE INSERT ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_attempts_fill_type_key();
```

- Use `BEFORE INSERT`, and also `BEFORE UPDATE OF <source_fk_column>` if the source FK can change.
- Always pair the trigger with a composite FK that makes drift impossible. The trigger fills the value; the FK guarantees it.
- In Drizzle, declare the column `.notNull().default(sql\`NULL\`)` so insert types treat it as optional.

### Deferred integrity check (constraint trigger)

```sql
CREATE OR REPLACE FUNCTION public.trg_puzzles_require_subtype()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  subtype_table text;
  has_subtype boolean;
BEGIN
  SELECT t.subtype_table INTO subtype_table
  FROM public.puzzle_types t
  WHERE t.key = NEW.type_key;

  EXECUTE pg_catalog.format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE puzzle_id = $1)', subtype_table)
    INTO has_subtype
    USING NEW.id;

  IF NOT has_subtype THEN
    RAISE EXCEPTION 'puzzle % (%) has no row in %', NEW.id, NEW.type_key, subtype_table
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_puzzles_require_subtype
  AFTER INSERT ON public.puzzles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_puzzles_require_subtype();
```

- Use `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` whenever the rule spans rows written in the same transaction (supertype plus subtype, puzzle plus "exactly one driver").
- Dynamic identifiers always go through `format('%I')`. Values go through `USING`, never string concatenation.
- Raise with an `ERRCODE` so tests can assert the failure class.

---

## 4. Return values and timing

| Timing | Use | Return |
|---|---|---|
| `BEFORE INSERT/UPDATE` | Fill or normalise columns on `NEW` | `RETURN NEW` |
| `AFTER … DEFERRABLE` constraint trigger | Cross-row integrity checks at commit | `RETURN NULL` |

Guard `UPDATE` triggers so they don't re-fire on unrelated changes:

```sql
IF NEW.puzzle_id IS DISTINCT FROM OLD.puzzle_id THEN … END IF;
```

---

## 5. Test it

Every trigger needs a Vitest integration test against local Postgres that proves:

1. the valid path works, e.g. the fill trigger populates the column;
2. the misuse fails, e.g. a missing subtype raises at commit, or a mismatched value is rejected by the FK.

Run `pnpm db:migrate && pnpm test`.

Don't run migrations against Neon production. They run in the Vercel build. Tell the user if a production migration needs attention.
