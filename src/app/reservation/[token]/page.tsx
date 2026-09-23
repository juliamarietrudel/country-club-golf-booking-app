import { notFound } from "next/navigation";
import { bookingIsOpen, dateString, formatDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { bookingDatesFor } from "@/lib/jobs";
import { saveBooking } from "./actions";
import styles from "./reservation.module.css";

export default async function ReservationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ confirmation?: string }> }) {
  const token = (await params).token;
  const confirmation = (await searchParams).confirmation === "1";
  const sql = db();
  const rows = await sql`SELECT i.id, i.week_start, i.expires_at, g.first_name, g.last_name FROM invitations i JOIN golfers g ON g.id=i.golfer_id WHERE i.token=${token} AND g.active=TRUE`;
  const invitation = rows[0];
  if (!invitation) notFound();
  const weekStart = dateString(invitation.week_start);
  const closed = new Date(invitation.expires_at) < new Date() || !bookingIsOpen(weekStart);
  const [dates, selectedRows] = await Promise.all([bookingDatesFor(weekStart), sql`SELECT play_date FROM booking_dates WHERE invitation_id=${invitation.id}`]);
  const selected = new Set(selectedRows.map((row) => dateString(row.play_date)));
  return <main className={styles.page}><div className={styles.brand}>Country Club de Montreal</div><section className={styles.card}><p className={styles.kicker}>Reservation de golf</p>{confirmation ? <div className={styles.confirmation}><div className={styles.checkmark}>✓</div><h1>Merci, {invitation.first_name}.</h1><p className={styles.intro}>Vos journees de golf ont bien ete enregistrees.</p>{selected.size ? <ul className={styles.chosenDates}>{[...selected].map((date) => <li key={date}>{formatDate(date)}</li>)}</ul> : <p className={styles.noDates}>Aucune journee n&apos;a ete selectionnee.</p>}{!closed && <a className={styles.editLink} href={`/reservation/${token}`}>Modifier mes choix</a>}<p className={styles.note}>Les modifications sont possibles jusqu&apos;a dimanche midi.</p></div> : <><h1>Bonjour, {invitation.first_name}.</h1><p className={styles.intro}>Choisissez les journees ou vous souhaitez jouer la semaine prochaine. Vous pouvez selectionner plus d&apos;une journee.</p>{closed ? <div className={styles.closed}><h2>Les reservations sont maintenant fermees.</h2><p>Les modifications devaient etre faites avant dimanche midi.</p></div> : <form action={saveBooking}><input type="hidden" name="token" value={token} /><fieldset><legend>Vos journees</legend>{dates.map((date) => <label className={styles.option} key={date}><input name="dates" type="checkbox" value={date} defaultChecked={selected.has(date)} /><span><strong>{formatDate(date)}</strong><small>Je souhaite jouer cette journee.</small></span></label>)}</fieldset><button>Enregistrer mes journees</button><p className={styles.note}>Vous pouvez modifier vos choix jusqu&apos;a dimanche midi.</p></form>}</>}</section></main>;
}
