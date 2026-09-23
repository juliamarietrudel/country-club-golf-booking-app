"use server";

import { revalidatePath } from "next/cache";
import { bookingIsOpen, dateString } from "@/lib/dates";
import { db } from "@/lib/db";
import { bookingDatesFor } from "@/lib/jobs";

export async function saveBooking(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const sql = db();
  const rows = await sql`SELECT id, week_start, expires_at FROM invitations WHERE token=${token}`;
  const invitation = rows[0];
  const weekStart = invitation && dateString(invitation.week_start);
  if (!invitation || new Date(invitation.expires_at) < new Date() || !bookingIsOpen(weekStart)) throw new Error("Cette reservation est fermee.");
  const allowed = await bookingDatesFor(weekStart);
  const selected = formData.getAll("dates").map(String).filter((date) => allowed.includes(date));
  await sql.begin(async (transaction) => {
    await transaction`DELETE FROM booking_dates WHERE invitation_id=${invitation.id}`;
    for (const date of selected) await transaction`INSERT INTO booking_dates (invitation_id, play_date) VALUES (${invitation.id}, ${date})`;
  });
  revalidatePath(`/reservation/${token}`);
}
