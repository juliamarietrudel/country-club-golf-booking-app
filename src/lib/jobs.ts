import crypto from "crypto";
import { db } from "@/lib/db";
import { addDays, availableDates, localDate, localHour, localWeekday, upcomingWeekStart, zonedTimeToUtc } from "@/lib/dates";
import { sendInvitation, sendReminder } from "@/lib/email";
import { scheduleFor } from "@/lib/schedules";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function sendWeeklyInvitations(weekStart = upcomingWeekStart(), golferIds?: string[], force = false) {
  const sql = db();
  const selected = golferIds ? new Set(golferIds) : undefined;
  const allGolfers = await sql`SELECT id, first_name, last_name, email FROM golfers WHERE active = TRUE`;
  const golfers = selected ? allGolfers.filter((golfer) => selected.has(golfer.id)) : allGolfers;
  let sent = 0;
  for (const golfer of golfers) {
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = zonedTimeToUtc(addDays(weekStart, -1), 12);
    const invitationRows = await sql`INSERT INTO invitations (golfer_id, week_start, token, expires_at) VALUES (${golfer.id}, ${weekStart}, ${token}, ${expiresAt}) ON CONFLICT (golfer_id, week_start) DO UPDATE SET expires_at=EXCLUDED.expires_at RETURNING id, token`;
    const invitation = invitationRows[0];
    const emailKey = `invitation:${invitation.id}`;
    const alreadySent = await sql`SELECT 1 FROM email_deliveries WHERE email_key=${emailKey}`;
    if (alreadySent.length && !force) continue;
    await sendInvitation(golfer.email, golfer.first_name, `${appUrl()}/reservation/${invitation.token}`);
    const deliveryKey = force ? `${emailKey}:manual:${crypto.randomUUID()}` : emailKey;
    await sql`INSERT INTO email_deliveries (email_key, invitation_id, kind) VALUES (${deliveryKey}, ${invitation.id}, 'invitation') ON CONFLICT DO NOTHING`;
    await sql`UPDATE invitations SET sent_at=NOW() WHERE id=${invitation.id}`;
    sent++;
  }
  return sent;
}

export async function sendDueReminders() {
  const sql = db();
  const tomorrow = addDays(localDate(), 1);
  const rows = await sql`SELECT i.id AS invitation_id, g.first_name, g.email, b.play_date FROM booking_dates b JOIN invitations i ON i.id=b.invitation_id JOIN golfers g ON g.id=i.golfer_id WHERE b.play_date=${tomorrow} AND g.active=TRUE`;
  for (const row of rows) {
    const emailKey = `reminder:${row.invitation_id}:${row.play_date}`;
    const alreadySent = await sql`SELECT 1 FROM email_deliveries WHERE email_key=${emailKey}`;
    if (alreadySent.length) continue;
    await sendReminder(row.email, row.first_name, row.play_date);
    await sql`INSERT INTO email_deliveries (email_key, invitation_id, kind, play_date) VALUES (${emailKey}, ${row.invitation_id}, 'reminder', ${row.play_date}) ON CONFLICT DO NOTHING`;
  }
  return rows.length;
}

export async function runScheduledJobs() {
  const hour = localHour();
  const weekday = localWeekday();
  const results: string[] = [];
  if (weekday === "Fri" && hour === 8) results.push(`invitations:${await sendWeeklyInvitations()}`);
  if (hour === 12) results.push(`rappels:${await sendDueReminders()}`);
  return results;
}

export async function bookingDatesFor(weekStart: string) {
  return availableDates(weekStart, await scheduleFor(weekStart));
}
