import { timingSafeEqual } from "crypto";
import { runScheduledJobs } from "@/lib/jobs";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || token.length !== secret.length || !timingSafeEqual(Buffer.from(token), Buffer.from(secret))) return new Response("Unauthorized", { status: 401 });
  const results = await runScheduledJobs();
  return Response.json({ ok: true, results });
}
