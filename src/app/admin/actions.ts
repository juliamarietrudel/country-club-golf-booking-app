"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSession, destroyAdminSession, passwordIsValid, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleFromForm } from "@/lib/schedules";
import { sendWeeklyInvitations } from "@/lib/jobs";
import { upcomingWeekStart } from "@/lib/dates";

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
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Informations du golfeur invalides.");
  await db()`INSERT INTO golfers (first_name, last_name, email) VALUES (${firstName}, ${lastName}, ${email})`;
  revalidatePath("/admin");
}
export async function toggleGolfer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await db()`UPDATE golfers SET active = ${active}, updated_at = NOW() WHERE id = ${id}`;
  revalidatePath("/admin");
}
export async function editGolfer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!id || !firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Informations du golfeur invalides.");
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error("Semaine invalide.");
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
