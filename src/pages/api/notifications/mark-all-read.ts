import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
import { markAllReadSchema } from '@/lib/schemas/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const parsed = markAllReadSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(', ');
        return res.status(400).json({ error: msg });
      }
      const { userId } = parsed.data;
      
      await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      return res.status(200).json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

