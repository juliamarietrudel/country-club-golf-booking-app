"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";
import { addBooking, removeBooking } from "./actions";
import styles from "./admin.module.css";

type Player = { id: string; first_name: string; last_name: string };
type Day = { date: string; label: string; bookings: Array<{ invitation_id: string; golfer_id: string; first_name: string; last_name: string }> };

export function BookingManager({ days, players }: { days: Day[]; players: Player[] }) {
  const [editing, setEditing] = useState(false);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const router = useRouter();

  function confirmRemoval(invitationId: string, playDate: string, name: string) {
    if (!window.confirm(`Retirer ${name} de cette journée?`)) return;
    startTransition(async () => {
      await removeBooking(invitationId, playDate);
      router.refresh();
    });
  }

  function submitAddition(event: FormEvent<HTMLFormElement>, playDate: string) {
    event.preventDefault();
    const golferId = String(new FormData(event.currentTarget).get("golferId") ?? "");
    if (!golferId) return;
    startTransition(async () => {
      await addBooking(golferId, playDate);
      setAddingDate(null);
      router.refresh();
    });
  }

  return <section className={styles.card}>
    <div className={styles.bookingHeader}><h2>Réservations de la prochaine semaine</h2><button className={styles.editBookings} onClick={() => { setEditing(!editing); setAddingDate(null); }}>{editing ? "Terminer" : "Modifier"}</button></div>
    <table className={styles.bookingTable}><thead><tr><th>Journée</th><th>Joueurs inscrits</th></tr></thead><tbody>{days.map((day) => {
      const availablePlayers = players.filter((player) => !day.bookings.some((booking) => booking.golfer_id === player.id));
      return <tr key={day.date}><th scope="row">{day.label}<span>{day.bookings.length} inscrit{day.bookings.length === 1 ? "" : "s"}</span></th><td><div className={styles.bookingNames}>{day.bookings.length ? <ul>{day.bookings.map((booking) => <li key={booking.invitation_id}>{booking.first_name} {booking.last_name}{editing && <button className={styles.removeBooking} onClick={() => confirmRemoval(booking.invitation_id, day.date, `${booking.first_name} ${booking.last_name}`)} aria-label={`Retirer ${booking.first_name} ${booking.last_name}`}>×</button>}</li>)}</ul> : <span className={styles.empty}>Aucun joueur inscrit.</span>}{editing && <button className={styles.addBooking} onClick={() => setAddingDate(addingDate === day.date ? null : day.date)} aria-label={`Ajouter un joueur pour ${day.label}`}>+</button>}</div>{editing && addingDate === day.date && <form className={styles.addBookingForm} onSubmit={(event) => submitAddition(event, day.date)}><select name="golferId" defaultValue="" required><option value="" disabled>Sélectionner un golfeur</option>{availablePlayers.map((player) => <option value={player.id} key={player.id}>{player.first_name} {player.last_name}</option>)}</select><button disabled={!availablePlayers.length}>Ajouter</button></form>}</td></tr>;
    })}</tbody></table>
  </section>;
}
