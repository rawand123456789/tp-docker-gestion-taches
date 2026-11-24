import pg from "pg";
import { readdir, readFile } from "node:fs/promises";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = (await readdir("./db/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const result = await client.query(
      "SELECT filename FROM schema_migrations WHERE filename = $1",
      [file]
    );

    if (result.rowCount > 0) {
      console.log(`Deja appliquee : ${file}`);
      continue;
    }

    const sql = await readFile(`./db/migrations/${file}`, "utf8");

    await client.query("BEGIN");

    try {
      await client.query(sql);

      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file]
      );

      await client.query("COMMIT");

      console.log(`Migration appliquee : ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
