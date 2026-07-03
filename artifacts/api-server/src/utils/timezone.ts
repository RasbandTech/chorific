/**
 * Compute the start/end of "today" as UTC Date objects, using the given
 * IANA timezone so that midnight is correct for the household's location.
 *
 * Strategy: ask Intl how many hours/minutes/seconds have elapsed since
 * midnight in that timezone, then subtract from now to get the UTC
 * timestamp that corresponds to local midnight.
 */
export function todayRangeInTz(timezone: string): { start: Date; end: Date } {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => {
    const val = parts.find((p) => p.type === type)?.value ?? "0";
    // Intl can return "24" for midnight in some locales
    return parseInt(val === "24" ? "0" : val, 10);
  };

  const msElapsed =
    (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000;

  const start = new Date(now.getTime() - msElapsed);
  start.setMilliseconds(0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

/**
 * Return the current day-of-week (0=Sun … 6=Sat) in the given timezone,
 * matching the JS Date.getDay() convention.
 */
export function todayDowInTz(timezone: string): number {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(new Date());
  const idx = weekdays.indexOf(label);
  return idx >= 0 ? idx : new Date().getDay();
}
