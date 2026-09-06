// One-time setup: creates (or updates the password for) the photographer
// account used to log into /admin. There is no public signup screen —
// this is a single-photographer app.
//
// Usage: node scripts/create-photographer.js you@example.com 'a-strong-password' "Sixth Lens"
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const [email, password, studioName = 'Sixth Lens'] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/create-photographer.js <email> <password> [studio name]');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=disable')
      ? false
      : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(
      `insert into photographers (email, password_hash, studio_name)
       values ($1, $2, $3)
       on conflict (email) do update set password_hash = excluded.password_hash, studio_name = excluded.studio_name`,
      [email, passwordHash, studioName]
    );
    console.log(`Photographer account ready for ${email}.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
