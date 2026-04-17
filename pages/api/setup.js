import bcrypt from 'bcryptjs';
import { getDb } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password, setupKey } = req.body;

  // Require a setup key to prevent anyone from calling this
  if (setupKey !== process.env.SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid setup key' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const sql = getDb();
  const existing = await sql`SELECT id FROM app_password LIMIT 1`;

  const hash = await bcrypt.hash(password, 12);

  if (existing.length) {
    // Update existing password
    await sql`UPDATE app_password SET hash = ${hash} WHERE id = ${existing[0].id}`;
  } else {
    await sql`INSERT INTO app_password (hash) VALUES (${hash})`;
  }

  return res.status(200).json({ ok: true, message: 'Password set successfully' });
}
