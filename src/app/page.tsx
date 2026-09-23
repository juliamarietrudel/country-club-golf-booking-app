import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.crest}>CCM</div>
      <p className={styles.kicker}>Country Club de Montreal</p>
      <h1>Les journees de golf, simplement.</h1>
      <p className={styles.copy}>Vos invitations de jeu sont envoyees par courriel chaque vendredi. Utilisez votre lien personnel pour confirmer vos journees.</p>
      <Link className={styles.adminLink} href="/admin">Acces administrateur</Link>
    </main>
  );
}
