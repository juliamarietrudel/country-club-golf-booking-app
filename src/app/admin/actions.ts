"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSession, destroyAdminSession, passwordIsValid, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleFromForm } from "@/lib/schedules";
import { sendWeeklyInvitations } from "@/lib/jobs";
import { addDays, upcomingWeekStart, zonedTimeToUtc } from "@/lib/dates";
import { bookingDatesFor } from "@/lib/jobs";

export async function login(formData: FormData) {
  if (!passwordIsValid(String(formData.get("password") ?? ""))) redirect("/admin?error=1");
  await createAdminSession();
  redirect("/admin");
}
export async function logout() { await destroyAdminSession(); redirect("/admin"); }
export async function addGolfer(formData: FormData) {
  await requireAdmin();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Les renseignements du golfeur sont invalides.");
  await db()`INSERT INTO golfers (first_name, last_name, email) VALUES (${firstName}, ${lastName}, ${email}) ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, active=TRUE, listed=TRUE, updated_at=NOW()`;
  revalidatePath("/admin");
}
export async function toggleGolfer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await db()`UPDATE golfers SET active = ${active}, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath("/admin");
}
export async function removeGolfer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db()`UPDATE golfers SET active=FALSE, listed=FALSE, updated_at=NOW() WHERE id=${id}`;
  revalidatePath("/admin");
}
export async function editGolfer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!id || !firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Les renseignements du golfeur sont invalides.");
  await db()`UPDATE golfers SET first_name=${firstName}, last_name=${lastName}, email=${email}, updated_at=NOW() WHERE id=${id}`;
  revalidatePath("/admin");
}
export async function saveDefaultSchedule(formData: FormData) {
  await requireAdmin();
  const schedule = scheduleFromForm(formData);
  const sql = db();
  await sql`UPDATE schedule_defaults SET monday=${schedule.lundi}, tuesday=${schedule.mardi}, wednesday=${schedule.mercredi}, thursday=${schedule.jeudi}, friday=${schedule.vendredi}, saturday=${schedule.samedi}, sunday=${schedule.dimanche}, updated_at=NOW() WHERE id=1`;
  revalidatePath("/admin");
}
export async function saveWeekSchedule(formData: FormData) {
  await requireAdmin();
  const weekStart = String(formData.get("weekStart") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error("La semaine est invalide.");
  const schedule = scheduleFromForm(formData);
  const sql = db();
  await sql`INSERT INTO weekly_overrides (week_start, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES (${weekStart}, ${schedule.lundi}, ${schedule.mardi}, ${schedule.mercredi}, ${schedule.jeudi}, ${schedule.vendredi}, ${schedule.samedi}, ${schedule.dimanche}) ON CONFLICT (week_start) DO UPDATE SET monday=EXCLUDED.monday, tuesday=EXCLUDED.tuesday, wednesday=EXCLUDED.wednesday, thursday=EXCLUDED.thursday, friday=EXCLUDED.friday, saturday=EXCLUDED.saturday, sunday=EXCLUDED.sunday, updated_at=NOW()`;
  revalidatePath("/admin");
}
export async function sendInvitationsNow() {
  await requireAdmin();
  const count = await sendWeeklyInvitations(upcomingWeekStart());
  revalidatePath("/admin");
  redirect(`/admin?sent=${count}`);
}
export async function resendSelectedInvitations(formData: FormData) {
  await requireAdmin();
  const golferIds = formData.getAll("golferIds").map(String).filter(Boolean);
  if (!golferIds.length) throw new Error("Sélectionnez au moins un golfeur.");
  const count = await sendWeeklyInvitations(upcomingWeekStart(), golferIds, true);
  revalidatePath("/admin");
  redirect(`/admin?sent=${count}&resend=1`);
}
export async function removeBooking(invitationId: string, playDate: string) {
  await requireAdmin();
  await db()`DELETE FROM booking_dates WHERE invitation_id=${invitationId} AND play_date=${playDate}`;
  revalidatePath("/admin");
}
export async function addBooking(golferId: string, playDate: string) {
  await requireAdmin();
  const weekStart = upcomingWeekStart();
  const allowedDates = await bookingDatesFor(weekStart);
  if (!allowedDates.includes(playDate)) throw new Error("La journée sélectionnée n'est pas disponible.");
  const sql = db();
  const golfers = await sql`SELECT id FROM golfers WHERE id=${golferId} AND active=TRUE AND listed=TRUE`;
  if (!golfers.length) throw new Error("Ce golfeur n'est plus actif.");
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = zonedTimeToUtc(addDays(weekStart, -1), 12);
  const invitations = await sql`INSERT INTO invitations (golfer_id, week_start, token, expires_at) VALUES (${golferId}, ${weekStart}, ${token}, ${expiresAt}) ON CONFLICT (golfer_id, week_start) DO UPDATE SET expires_at=EXCLUDED.expires_at RETURNING id`;
  await sql`INSERT INTO booking_dates (invitation_id, play_date) VALUES (${invitations[0].id}, ${playDate}) ON CONFLICT DO NOTHING`;
  revalidatePath("/admin");
}
