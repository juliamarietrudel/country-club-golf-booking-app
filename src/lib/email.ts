import { Resend } from "resend";
import { formatDate } from "@/lib/dates";

function client() { if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required."); return new Resend(process.env.RESEND_API_KEY); }
const sender = () => process.env.EMAIL_FROM ?? "Country Club de Montreal <onboarding@resend.dev>";
export async function sendInvitation(email: string, name: string, link: string) {
  return client().emails.send({ from: sender(), to: email, subject: "Vos journees de golf - Country Club de Montreal", html: `<p>Bonjour ${name},</p><p>Veuillez choisir les journees ou vous souhaitez jouer la semaine prochaine.</p><p><a href="${link}">Choisir mes journees</a></p><p>Les modifications sont possibles jusqu'a dimanche midi.</p><p>Vincent Trudel<br>Country Club de Montreal</p>` });
}
export async function sendReminder(email: string, name: string, date: string) {
  return client().emails.send({ from: sender(), to: email, subject: "Rappel de golf demain", html: `<p>Bonjour ${name},</p><p>Nous vous rappelons votre journee de golf demain, ${formatDate(date)}.</p><p>Au plaisir de vous voir.</p><p>Vincent Trudel<br>Country Club de Montreal</p>` });
}
