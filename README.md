# Country Club de Montréal - Golf

Application de réservation hebdomadaire pour les golfeurs du Country Club de Montréal.

## Fonctionnalites

- Une administration protegee par mot de passe.
- Gestion des golfeurs actifs et inactifs.
- Jours de jeu par defaut et exceptions pour une semaine precise.
- Invitations privees, sans compte golfeur, envoyees chaque vendredi a 8 h.
- Reservations de plusieurs jours modifiables jusqu'au dimanche a midi.
- Rappels par courriel a midi la veille de chaque journee choisie.
- Tous les horaires utilisent le fuseau `America/Toronto`.

## Demarrage local

1. Copiez `.env.example` vers `.env.local` et renseignez les valeurs.
2. Creez une base PostgreSQL et appliquez le schema avec `npm run db:push`.
3. Lancez l'application avec `npm run dev`.
4. Ouvrez `http://localhost:3000/admin` et utilisez `ADMIN_PASSWORD`.

## Courriel

Le developpement peut utiliser l'expediteur de test Resend. Avant la mise en production, ajoutez et verifiez un domaine d'envoi dans Resend, puis remplacez `EMAIL_FROM` par une adresse de ce domaine.

## Render

`render.yaml` declare le service web, PostgreSQL et une tache cron horaire. Dans Render, renseignez les variables de `.env.example` pour les deux services et utilisez l'URL publique finale dans `NEXT_PUBLIC_APP_URL`.

La tache cron s'execute chaque heure; l'application n'envoie des invitations que le vendredi a 8 h et des rappels a midi, selon l'heure de Montreal. Les enregistrements d'envoi empechent les doublons en cas de nouvelle tentative de la tache.

Appliquez `db/schema.sql` a la base Render avant le premier deploiement. Le compte Render doit disposer de l'outil `psql`, ou le fichier peut etre execute dans le tableau de bord PostgreSQL Render.
