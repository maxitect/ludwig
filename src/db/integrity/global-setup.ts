import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { testDatabaseUrl } from "./test-database";

/** Creates `<admin db>_test` if missing and migrates it once per run. */
export default async function setup() {
  const adminUrl = process.env.INTEGRITY_ADMIN_DATABASE_URL!;
  const testUrl = testDatabaseUrl(adminUrl);
  const testName = new URL(testUrl).pathname.slice(1);

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      "select 1 from pg_database where datname = $1",
      [testName],
    );
    if (!rowCount) {
      await admin.query(`create database "${testName}"`);
    }
  } finally {
    await admin.end();
  }

  const client = new Client({ connectionString: testUrl });
  await client.connect();
  try {
    await migrate(drizzle({ client }), { migrationsFolder: "drizzle" });
  } finally {
    await client.end();
  }
}
