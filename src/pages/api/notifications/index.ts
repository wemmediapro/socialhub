import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
import { createNotificationSchema } from '@/lib/schemas/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { userId, unreadOnly } = req.query;
      
      const query: { userId?: string; isRead?: boolean } = {};
      if (userId && typeof userId === 'string') {
        query.userId = userId;
      }
      if (unreadOnly === 'true') {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50);
      
      const unreadCount = await Notification.countDocuments({ 
        ...(query.userId ? { userId: query.userId } : {}),
        isRead: false 
      });

      return res.status(200).json({ notifications, unreadCount });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsed = createNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(', ');
        return res.status(400).json({ error: msg });
      }
      const notification = await Notification.create(parsed.data);
      return res.status(201).json({ notification });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

