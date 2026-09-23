import { notFound } from "next/navigation";
import { bookingIsOpen, formatDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { bookingDatesFor } from "@/lib/jobs";
import { saveBooking } from "./actions";
import styles from "./reservation.module.css";

export default async function ReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const sql = db();
  const rows = await sql`SELECT i.id, i.week_start, i.expires_at, g.first_name, g.last_name FROM invitations i JOIN golfers g ON g.id=i.golfer_id WHERE i.token=${token} AND g.active=TRUE`;
  const invitation = rows[0];
  if (!invitation) notFound();
  const closed = new Date(invitation.expires_at) < new Date() || !bookingIsOpen(invitation.week_start);
  const [dates, selectedRows] = await Promise.all([bookingDatesFor(invitation.week_start), sql`SELECT play_date FROM booking_dates WHERE invitation_id=${invitation.id}`]);
  const selected = new Set(selectedRows.map((row) => row.play_date));
  return <main className={styles.page}><div className={styles.brand}>Country Club de Montreal</div><section className={styles.card}><p className={styles.kicker}>Reservation de golf</p><h1>Bonjour, {invitation.first_name}.</h1><p className={styles.intro}>Choisissez les journees ou vous souhaitez jouer la semaine prochaine. Vous pouvez selectionner plus d&apos;une journee.</p>{closed ? <div className={styles.closed}><h2>Les reservations sont maintenant fermees.</h2><p>Les modifications devaient etre faites avant dimanche midi.</p></div> : <form action={saveBooking}><input type="hidden" name="token" value={token} /><fieldset><legend>Vos journees</legend>{dates.map((date) => <label className={styles.option} key={date}><input name="dates" type="checkbox" value={date} defaultChecked={selected.has(date)} /><span><strong>{formatDate(date)}</strong><small>Je souhaite jouer cette journee.</small></span></label>)}</fieldset><button>Enregistrer mes journees</button><p className={styles.note}>Vous pouvez modifier vos choix jusqu&apos;a dimanche midi.</p></form>}</section></main>;
}
