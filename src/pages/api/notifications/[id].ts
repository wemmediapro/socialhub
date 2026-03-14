import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      // Mark as read
      const notification = await Notification.findByIdAndUpdate(
        id,
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification non trouvée' });
      }

      return res.status(200).json({ notification });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const notification = await Notification.findByIdAndDelete(id);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification non trouvée' });
      }

      return res.status(200).json({ message: 'Notification supprimée' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

