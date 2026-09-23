import { Resend } from "resend";
import { formatDate } from "@/lib/dates";

function client() { if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required."); return new Resend(process.env.RESEND_API_KEY); }
const sender = () => process.env.EMAIL_FROM ?? "Country Club de Montreal <onboarding@resend.dev>";
function escapeHtml(value: string) { return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character); }
function invitationHtml(name: string, link: string) {
  return `<div style="margin:0;padding:0;background:#f3f2ed;font-family:Arial,Helvetica,sans-serif;color:#25343e"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f2ed"><tr><td style="padding:42px 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff"><tr><td style="padding:34px 42px 30px;background:#25343e;text-align:center"><div style="display:inline-block;width:46px;height:46px;border:1px solid #c6b99f;border-radius:50%;color:#c6b99f;font-family:Georgia,serif;font-size:14px;letter-spacing:2px;line-height:46px">CCM</div><p style="margin:14px 0 0;color:#c6b99f;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Country Club de Montreal</p></td></tr><tr><td style="padding:42px"><p style="margin:0 0 18px;color:#7b7465;font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase">Reservation de golf</p><h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:35px;font-weight:normal;line-height:1.1;color:#25343e">Bonjour ${escapeHtml(name)},</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.65">Veuillez choisir les journees ou vous souhaitez jouer la semaine prochaine.</p><p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#57636a">Votre lien est disponible jusqu&apos;a dimanche midi. Vous pouvez y revenir en tout temps avant cette limite pour choisir ou modifier vos journees.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="background:#25343e"><a href="${link}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none">Choisir mes journees</a></td></tr></table><p style="margin:32px 0 0;padding-top:22px;border-top:1px solid #e6e4de;color:#778087;font-size:12px;line-height:1.5">Vincent Trudel<br>Country Club de Montreal</p></td></tr></table></td></tr></table></div>`;
}
export async function sendInvitation(email: string, name: string, link: string) {
  const result = await client().emails.send({ from: sender(), to: email, subject: "Vos journees de golf - Country Club de Montreal", html: invitationHtml(name, link) });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function sendReminder(email: string, name: string, date: string) {
  const result = await client().emails.send({ from: sender(), to: email, subject: "Rappel de golf demain", html: `<p>Bonjour ${name},</p><p>Nous vous rappelons votre journee de golf demain, ${formatDate(date)}.</p><p>Au plaisir de vous voir.</p><p>Vincent Trudel<br>Country Club de Montreal</p>` });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
