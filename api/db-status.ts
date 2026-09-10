import type { VercelRequest, VercelResponse } from '@vercel/node';
import { testConnection } from '../server/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const status = await testConnection();
    return res.status(200).json(status);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
