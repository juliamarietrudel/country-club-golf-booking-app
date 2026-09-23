import crypto from "crypto";
import { cookies } from "next/headers";

const cookieName = "ccm_admin";
function signature() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is required.");
  return crypto.createHmac("sha256", secret).update("country-club-admin").digest("hex");
}
export function passwordIsValid(value: string) {
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? "");
  const actual = Buffer.from(value);
  return expected.length > 0 && expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
export async function isAdmin() { return (await cookies()).get(cookieName)?.value === signature(); }
export async function requireAdmin() { if (!(await isAdmin())) throw new Error("Non autorise."); }
export async function createAdminSession() { (await cookies()).set(cookieName, signature(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 }); }
export async function destroyAdminSession() { (await cookies()).delete(cookieName); }
