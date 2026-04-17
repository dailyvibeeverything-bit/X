import bcrypt from 'bcryptjs';
import { getDb } from '../../lib/db';
import { signToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const sql = getDb();
    const rows = await sql`SELECT hash FROM app_password LIMIT 1`;
    if (!rows.length) return res.status(404).json({ error: 'No password set. Visit /api/setup first.' });

    const valid = await bcrypt.compare(password, rows[0].hash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    const token = await signToken();
    res.setHeader('Set-Cookie', `auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', 'auth=; Path=/; HttpOnly; Max-Age=0');
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
