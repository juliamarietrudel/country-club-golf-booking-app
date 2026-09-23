import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { availableDates, dateString, formatDate, upcomingWeekStart, weekdays } from "@/lib/dates";
import { scheduleFor } from "@/lib/schedules";
import { addGolfer, login, logout, resendSelectedInvitations, saveDefaultSchedule, saveWeekSchedule, sendInvitationsNow } from "./actions";
import { BookingManager } from "./booking-manager";
import { GolferRow } from "./golfer-row";
import styles from "./admin.module.css";

function ScheduleFields({ schedule }: { schedule: Record<string, boolean> }) {
  return <div className={styles.dayChoices}>{weekdays.map((day) => <label key={day}><input type="checkbox" name={day} defaultChecked={schedule[day]} />{day}</label>)}</div>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; resend?: string }> }) {
  if (!(await isAdmin())) {
    const error = (await searchParams).error;
    return <main className={styles.login}><p className={styles.eyebrow}>Country Club de Montréal</p><h1>Espace administrateur</h1><form action={login}><label>Mot de passe<input name="password" type="password" autoFocus required /></label>{error && <p className={styles.error}>Le mot de passe est incorrect.</p>}<button>Ouvrir la session</button></form></main>;
  }
  const { sent, resend } = await searchParams;
  const sql = db();
  const weekStart = upcomingWeekStart();
  const [golferRows, defaultRows, weekSchedule, bookings] = await Promise.all([
    sql`SELECT id, first_name, last_name, email, active FROM golfers WHERE listed=TRUE ORDER BY active DESC, last_name, first_name`,
    sql`SELECT * FROM schedule_defaults WHERE id = 1`, scheduleFor(weekStart),
    sql`SELECT i.id AS invitation_id, g.id AS golfer_id, g.first_name, g.last_name, b.play_date FROM invitations i JOIN golfers g ON g.id=i.golfer_id JOIN booking_dates b ON b.invitation_id=i.id WHERE i.week_start=${weekStart} ORDER BY g.last_name, g.first_name, b.play_date`,
  ]);
  const golfers = golferRows as unknown as Array<{ id: string; first_name: string; last_name: string; email: string; active: boolean }>;
  const defaultRow = defaultRows[0] as Record<string, boolean>;
  const defaults = { lundi: defaultRow.monday, mardi: defaultRow.tuesday, mercredi: defaultRow.wednesday, jeudi: defaultRow.thursday, vendredi: defaultRow.friday, samedi: defaultRow.saturday, dimanche: defaultRow.sunday };
  const dates = availableDates(weekStart, weekSchedule);
  const bookingsByDate = Object.fromEntries(dates.map((date) => [date, bookings.filter((booking) => dateString(booking.play_date) === date)]));
  const totals = Object.fromEntries(dates.map((date) => [date, bookingsByDate[date].length]));
  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Country Club de Montréal</p><h1>Tableau de bord</h1></div><form action={logout}><button className={styles.textButton}>Fermer la session</button></form></header>
    <section className={styles.overview}><div><p className={styles.eyebrow}>Prochaine semaine</p><h2>Du {formatDate(weekStart)}</h2></div><div className={styles.totals}>{dates.map((date) => { const [day, ...dateParts] = formatDate(date).split(" "); return <div key={date}><strong>{totals[date]}</strong><span><small>{day}</small>{dateParts.join(" ")}</span></div>; })}</div></section>
    <section className={styles.send}><div><p className={styles.eyebrow}>Envoi hebdomadaire</p><h2>Envoyer les invitations</h2><p>Les invitations qui n&apos;ont pas encore été envoyées pour la prochaine semaine seront transmises immédiatement. Les envois déjà effectués ne seront pas répétés.</p></div><form action={sendInvitationsNow}><button>Envoyer maintenant</button></form></section>
    {sent !== undefined && <p className={styles.success}>{resend === "1" ? `${sent} invitation${sent === "1" ? " a été renvoyée" : "s ont été renvoyées"} aux golfeurs sélectionnés.` : `${sent} invitation${sent === "1" ? " traitée" : "s traitées"}.`} Vérifiez Resend pour confirmer la livraison.</p>}
    <section className={styles.card}><h2>Renvoyer une invitation</h2><p>Sélectionnez les golfeurs qui doivent recevoir une nouvelle copie de l&apos;invitation de la prochaine semaine.</p><form action={resendSelectedInvitations}><div className={styles.resendList}>{golfers.filter((golfer) => golfer.active).map((golfer) => <label key={golfer.id}><input type="checkbox" name="golferIds" value={golfer.id} />{golfer.first_name} {golfer.last_name}<span>{golfer.email}</span></label>)}</div><button>Renvoyer aux golfeurs sélectionnés</button></form></section>
    <section className={styles.grid}>
      <article className={styles.card}><h2>Ajouter un golfeur</h2><form action={addGolfer} className={styles.form}><input name="firstName" placeholder="Prénom" required /><input name="lastName" placeholder="Nom" required /><input name="email" type="email" placeholder="Courriel" required /><button>Ajouter</button></form></article>
      <article className={styles.card}><h2>Jours par défaut</h2><p>Ces jours seront proposés dans les prochaines invitations.</p><form action={saveDefaultSchedule}><ScheduleFields schedule={defaults} /><button>Enregistrer les jours</button></form></article>
      <article className={styles.card}><h2>Exception pour la prochaine semaine</h2><p>Du {formatDate(weekStart)}. Cette configuration remplace les jours par défaut pour cette semaine seulement.</p><form action={saveWeekSchedule}><input type="hidden" name="weekStart" value={weekStart} /><ScheduleFields schedule={weekSchedule} /><button>Enregistrer l&apos;exception</button></form></article>
    </section>
    <section className={styles.card}><details className={styles.golfersPanel} open><summary><span>Golfeurs ({golfers.length})</span><span className={styles.panelToggle}><span className={styles.closeLabel}>Fermer la section</span><span className={styles.openLabel}>Ouvrir la section</span></span></summary><p className={styles.statusHelp}><strong>Actif</strong> : reçoit les invitations et les rappels. <strong>Désactivé</strong> : reste dans l&apos;historique, mais ne reçoit plus de courriel. <strong>Supprimé</strong> : retiré de cette liste et des envois, mais conservé dans la base de données.</p><div className={styles.table}>{golfers.map((golfer) => <GolferRow key={golfer.id} golfer={golfer} />)}</div></details></section>
    <BookingManager days={dates.map((date) => ({ date, label: formatDate(date), bookings: bookingsByDate[date].map((booking) => ({ invitation_id: booking.invitation_id, golfer_id: booking.golfer_id, first_name: booking.first_name, last_name: booking.last_name })) }))} players={golfers.filter((golfer) => golfer.active).map((golfer) => ({ id: golfer.id, first_name: golfer.first_name, last_name: golfer.last_name }))} />
  </main>;
}
