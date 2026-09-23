"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { editGolfer, removeGolfer, toggleGolfer } from "./actions";
import styles from "./admin.module.css";

type GolferRowProps = {
  golfer: { id: string; first_name: string; last_name: string; email: string; active: boolean };
};

export function GolferRow({ golfer }: GolferRowProps) {
  const [firstName, setFirstName] = useState(golfer.first_name);
  const [lastName, setLastName] = useState(golfer.last_name);
  const [email, setEmail] = useState(golfer.email);
  const dirty = firstName !== golfer.first_name || lastName !== golfer.last_name || email !== golfer.email;

  return <div className={`${styles.row} ${!golfer.active ? styles.inactiveRow : ""}`}>
    <form action={editGolfer} className={styles.golferForm}>
      <input type="hidden" name="id" value={golfer.id} />
      <input name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} aria-label="Prénom" required />
      <input name="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} aria-label="Nom" required />
      <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Courriel" required />
      <button className={styles.saveButton} type="submit" disabled={!dirty} aria-label="Enregistrer les modifications" title="Enregistrer les modifications"><FontAwesomeIcon icon={faCheck} /></button>
    </form>
    <div className={styles.golferActions}>
      <form action={toggleGolfer}><input type="hidden" name="id" value={golfer.id} /><input type="hidden" name="active" value={String(!golfer.active)} /><button className={styles.statusButton}>{golfer.active ? "Désactiver" : "Réactiver"}</button></form>
      <form action={removeGolfer}><input type="hidden" name="id" value={golfer.id} /><button className={styles.removeButton}>Supprimer</button></form>
    </div>
  </div>;
}
