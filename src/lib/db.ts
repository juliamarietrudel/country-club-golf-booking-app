import postgres from "postgres";

declare global {
  var sqlClient: postgres.Sql | undefined;
}

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!global.sqlClient) global.sqlClient = postgres(process.env.DATABASE_URL, { prepare: false });
  return global.sqlClient;
}
