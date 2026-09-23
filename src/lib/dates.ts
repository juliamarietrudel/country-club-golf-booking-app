export const TIME_ZONE = "America/Toronto";
export const weekdays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
export type Weekday = (typeof weekdays)[number];

function ymd(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function localDate(now = new Date()) { return ymd(now); }

function offsetMilliseconds(date: Date) {
  const value = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT-05:00";
  const match = value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  return (Number(match[2]) * 60 + Number(match[3])) * 60_000 * (match[1] === "+" ? 1 : -1);
}

export function zonedTimeToUtc(date: string, hour: number) {
  const [year, month, day] = date.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour);
  utc = Date.UTC(year, month - 1, day, hour) - offsetMilliseconds(new Date(utc));
  return new Date(utc);
}

export function dateString(date: string | Date) {
  return date instanceof Date ? date.toISOString().slice(0, 10) : date.slice(0, 10);
}

export function addDays(date: string | Date, days: number) {
  const result = new Date(`${dateString(date)}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function upcomingWeekStart(now = new Date()) {
  const local = ymd(now);
  const day = new Date(`${local}T12:00:00Z`).getUTCDay();
  return addDays(local, day === 0 ? 1 : 8 - day);
}

export function cutoffFor(weekStart: string | Date) { return zonedTimeToUtc(addDays(weekStart, -1), 12); }
export function bookingIsOpen(weekStart: string | Date) { return new Date() < cutoffFor(weekStart); }
export function formatDate(date: string | Date) { return new Intl.DateTimeFormat("fr-CA", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(new Date(`${dateString(date)}T12:00:00Z`)); }
export function dayKey(date: string | Date): Weekday { return weekdays[(new Date(`${dateString(date)}T12:00:00Z`).getUTCDay() + 6) % 7]; }
export function availableDates(weekStart: string, schedule: Record<Weekday, boolean>) { return weekdays.filter((day) => schedule[day]).map((day) => addDays(weekStart, weekdays.indexOf(day))); }
export function localHour(now = new Date()) { return Number(new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(now)); }
export function localWeekday(now = new Date()) { return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" }).format(now); }
