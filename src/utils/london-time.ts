const offsetFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  timeZoneName: "shortOffset",
});

function londonOffsetMinutes(at: Date) {
  const name = offsetFormat
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  const [, hours = "0"] = /^GMT([+-]\d+)?$/.exec(name ?? "") ?? [];
  return Number(hours) * 60;
}

/** The instant a `YYYY-MM-DD` calendar date starts in Europe/London. */
export function londonMidnight(date: string) {
  const utcMidnight = new Date(`${date}T00:00:00Z`);
  return new Date(
    utcMidnight.getTime() - londonOffsetMinutes(utcMidnight) * 60_000,
  );
}
