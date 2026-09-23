import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { availableDates, formatDate, upcomingWeekStart, weekdays } from "@/lib/dates";
import { scheduleFor } from "@/lib/schedules";
import { addGolfer, editGolfer, login, logout, saveDefaultSchedule, saveWeekSchedule, sendInvitationsNow, toggleGolfer } from "./actions";
import styles from "./admin.module.css";

function ScheduleFields({ schedule }: { schedule: Record<string, boolean> }) {
  return <div className={styles.dayChoices}>{weekdays.map((day) => <label key={day}><input type="checkbox" name={day} defaultChecked={schedule[day]} />{day}</label>)}</div>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdmin())) {
    const error = (await searchParams).error;
    return <main className={styles.login}><p className={styles.eyebrow}>Country Club de Montreal</p><h1>Espace administrateur</h1><form action={login}><label>Mot de passe<input name="password" type="password" autoFocus required /></label>{error && <p className={styles.error}>Mot de passe incorrect.</p>}<button>Ouvrir la session</button></form></main>;
  }
  const sql = db();
  const weekStart = upcomingWeekStart();
  const [golfers, defaultRows, weekSchedule, bookings] = await Promise.all([
    sql`SELECT id, first_name, last_name, email, active FROM golfers ORDER BY active DESC, last_name, first_name`,
    sql`SELECT * FROM schedule_defaults WHERE id = 1`, scheduleFor(weekStart),
    sql`SELECT g.first_name, g.last_name, b.play_date FROM invitations i JOIN golfers g ON g.id=i.golfer_id JOIN booking_dates b ON b.invitation_id=i.id WHERE i.week_start=${weekStart} ORDER BY g.last_name, g.first_name, b.play_date`,
  ]);
  const defaultRow = defaultRows[0] as Record<string, boolean>;
  const defaults = { lundi: defaultRow.monday, mardi: defaultRow.tuesday, mercredi: defaultRow.wednesday, jeudi: defaultRow.thursday, vendredi: defaultRow.friday, samedi: defaultRow.saturday, dimanche: defaultRow.sunday };
  const dates = availableDates(weekStart, weekSchedule);
  const totals = Object.fromEntries(dates.map((date) => [date, bookings.filter((booking) => booking.play_date === date).length]));
  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Country Club de Montreal</p><h1>Tableau de bord</h1></div><form action={logout}><button className={styles.textButton}>Fermer la session</button></form></header>
    <section className={styles.overview}><div><p className={styles.eyebrow}>Prochaine semaine</p><h2>Du {formatDate(weekStart)}</h2></div><div className={styles.totals}>{dates.map((date) => <div key={date}><strong>{totals[date]}</strong><span>{formatDate(date)}</span></div>)}</div></section>
    <section className={styles.send}><div><p className={styles.eyebrow}>Envoi hebdomadaire</p><h2>Envoyer les invitations</h2><p>Les invitations non envoyees pour la prochaine semaine seront transmises immediatement. Les envois deja effectues ne seront pas repetes.</p></div><form action={sendInvitationsNow}><button>Envoyer maintenant</button></form></section>
    <section className={styles.grid}>
      <article className={styles.card}><h2>Ajouter un golfeur</h2><form action={addGolfer} className={styles.form}><input name="firstName" placeholder="Prenom" required /><input name="lastName" placeholder="Nom" required /><input name="email" type="email" placeholder="Courriel" required /><button>Ajouter</button></form></article>
      <article className={styles.card}><h2>Jours par defaut</h2><p>Ces jours seront proposes dans les prochaines invitations.</p><form action={saveDefaultSchedule}><ScheduleFields schedule={defaults} /><button>Enregistrer les jours</button></form></article>
      <article className={styles.card}><h2>Exception pour la prochaine semaine</h2><p>Du {formatDate(weekStart)}. Cette configuration remplace les jours par defaut pour cette semaine seulement.</p><form action={saveWeekSchedule}><input type="hidden" name="weekStart" value={weekStart} /><ScheduleFields schedule={weekSchedule} /><button>Enregistrer l&apos;exception</button></form></article>
    </section>
    <section className={styles.card}><h2>Golfeurs</h2><div className={styles.table}>{golfers.map((golfer) => <div className={styles.row} key={golfer.id}><form action={editGolfer} className={styles.golferForm}><input type="hidden" name="id" value={golfer.id} /><input name="firstName" defaultValue={golfer.first_name} aria-label="Prenom" required /><input name="lastName" defaultValue={golfer.last_name} aria-label="Nom" required /><input name="email" type="email" defaultValue={golfer.email} aria-label="Courriel" required /><button className={styles.textButton}>Enregistrer</button></form><form action={toggleGolfer}><input type="hidden" name="id" value={golfer.id} /><input type="hidden" name="active" value={String(!golfer.active)} /><button className={styles.textButton}>{golfer.active ? "Desactiver" : "Reactiver"}</button></form></div>)}</div></section>
    <section className={styles.card}><h2>Reservations de la prochaine semaine</h2>{bookings.length ? <div className={styles.table}>{bookings.map((booking, index) => <div className={styles.row} key={`${booking.first_name}-${booking.play_date}-${index}`}><strong>{booking.first_name} {booking.last_name}</strong><span>{formatDate(booking.play_date)}</span></div>)}</div> : <p>Aucune reservation pour le moment.</p>}</section>
  </main>;
}
