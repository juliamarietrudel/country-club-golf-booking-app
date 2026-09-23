import { db } from "@/lib/db";
import { type Weekday } from "@/lib/dates";

export type Schedule = Record<Weekday, boolean>;
const columns = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export async function scheduleFor(weekStart: string): Promise<Schedule> {
  const sql = db();
  const rows = await sql`SELECT * FROM weekly_overrides WHERE week_start = ${weekStart} UNION ALL SELECT * FROM schedule_defaults WHERE NOT EXISTS (SELECT 1 FROM weekly_overrides WHERE week_start = ${weekStart}) LIMIT 1`;
  const row = rows[0] as Record<string, boolean>;
  return Object.fromEntries(columns.map((column, index) => [Object.values(["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"])[index], row[column]])) as Schedule;
}
export function scheduleFromForm(data: FormData): Schedule { return Object.fromEntries(["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map((day) => [day, data.get(day) === "on"])) as Schedule; }
export const scheduleColumns = columns;
