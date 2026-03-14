import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Account from '@/models/Account';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const accounts = await Account.find({}).sort({ createdAt: -1 });
      
      // Remove sensitive data (tokens)
      const safeAccounts = accounts.map(acc => ({
        id: acc._id,
        network: acc.network,
        pageId: acc.pageId,
        igUserId: acc.igUserId,
        extra: acc.extra,
        createdAt: acc.createdAt || new Date(),
        updatedAt: acc.updatedAt || new Date(),
        hasToken: !!acc.accessToken,
        tokenExpires: acc.expiresAt
      }));

      return res.status(200).json({ accounts: safeAccounts });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
