import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.crest}>CCM</div>
      <p className={styles.kicker}>Country Club de Montréal</p>
      <h1>Les journées de golf, simplement.</h1>
      <p className={styles.copy}>Vos invitations de jeu sont envoyées par courriel chaque vendredi. Utilisez votre lien personnel pour confirmer vos journées.</p>
      <Link className={styles.adminLink} href="/admin">Accès administrateur</Link>
    </main>
  );
}
