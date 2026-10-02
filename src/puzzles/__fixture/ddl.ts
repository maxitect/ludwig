/** Test-only DDL, applied by the Vitest global setup. The fixture type has no migration. */
export const fixtureDdl = [
  `create table if not exists fixture_puzzles (
    puzzle_id uuid primary key,
    type_key text generated always as ('__fixture') stored,
    note text not null,
    foreign key (puzzle_id, type_key) references puzzles (id, type_key) on delete cascade
  )`,
  `create table if not exists fixture_items (
    puzzle_id uuid not null references fixture_puzzles (puzzle_id) on delete cascade,
    position smallint not null,
    label text not null,
    primary key (puzzle_id, position)
  )`,
];
