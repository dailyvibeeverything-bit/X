import { getDb } from '../../../lib/db';

export default async function handler(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const rows = await sql`SELECT id, name, state, created_at FROM templates ORDER BY created_at DESC`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { name, state } = req.body;
    if (!name || !state) return res.status(400).json({ error: 'name and state required' });
    const rows = await sql`
      INSERT INTO templates (name, state) VALUES (${name}, ${JSON.parse(state)})
      RETURNING id, name, created_at
    `;
    return res.status(201).json(rows[0]);
  }

  res.status(405).end();
}
