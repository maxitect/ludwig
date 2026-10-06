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

const londonDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
});

const DAY_MS = 86_400_000;

/** Whether a `YYYY-MM-DD` calendar date is a Monday. */
export function isMonday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 1;
}

/** The `YYYY-MM-DD` of the Monday (00:00 Europe/London) that starts the week containing `at`. */
export function londonWeekStart(at: Date) {
  const today = new Date(`${londonDateFormat.format(at)}T00:00:00Z`);
  const sinceMonday = (today.getUTCDay() + 6) % 7;
  return new Date(today.getTime() - sinceMonday * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** The instant a `YYYY-MM-DD` calendar date starts in Europe/London. */
export function londonMidnight(date: string) {
  const utcMidnight = new Date(`${date}T00:00:00Z`);
  return new Date(
    utcMidnight.getTime() - londonOffsetMinutes(utcMidnight) * 60_000,
  );
}

/** The `YYYY-MM-DD` calendar date in Europe/London at the instant `at`. */
export function londonDate(at: Date) {
  return londonDateFormat.format(at);
}
