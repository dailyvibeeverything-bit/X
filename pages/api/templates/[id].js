import { getDb } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const sql = getDb();

  if (req.method === 'DELETE') {
    await sql`DELETE FROM templates WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
