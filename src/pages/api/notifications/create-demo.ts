import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      // Clear existing demo notifications
      await Notification.deleteMany({ userId: "DEMO_USER" });

      // Create demo notifications
      const demoNotifications = [
        {
          userId: "DEMO_USER",
          userRole: "digital_creative",
          type: "POST_CREATED",
          title: "📝 Nouveau post à créer",
          message: "Un nouveau post Instagram vous a été assigné pour Summer Campaign",
          link: "/workflow",
          priority: "high",
          isRead: false
        },
        {
          userId: "DEMO_USER",
          userRole: "infographiste",
          type: "CONTENT_UPLOADED",
          title: "📤 Contenu uploadé",
          message: "Marie a uploadé les visuels pour le post Instagram",
          link: "/workflow",
          priority: "medium",
          isRead: false
        },
        {
          userId: "DEMO_USER",
          userRole: "client",
          type: "CLIENT_VALIDATED",
          title: "✅ Contenu validé",
          message: "Le client a validé le post 'Nouvelle collection été'",
          link: "/workflow",
          priority: "medium",
          isRead: true,
          readAt: new Date(Date.now() - 3600000)
        },
        {
          userId: "DEMO_USER",
          userRole: "digital_creative",
          type: "POST_SCHEDULED",
          title: "📅 Post planifié",
          message: "Le post Instagram sera publié le 20 novembre à 14h",
          link: "/calendar",
          priority: "low",
          isRead: true,
          readAt: new Date(Date.now() - 7200000)
        },
        {
          userId: "DEMO_USER",
          userRole: "digital_creative",
          type: "POST_PUBLISHED",
          title: "🚀 Post publié !",
          message: "Votre post a été publié avec succès • Reach: 85K",
          link: "/workflow",
          priority: "medium",
          isRead: false
        },
        {
          userId: "DEMO_USER",
          userRole: "infographiste",
          type: "COMMENT_ADDED",
          message: "Sophie : 'Pouvez-vous ajuster la couleur du logo ?'",
          title: "💬 Nouveau commentaire",
          link: "/workflow",
          priority: "medium",
          isRead: false
        },
        {
          userId: "DEMO_USER",
          userRole: "digital_creative",
          type: "COLLAB_CREATED",
          title: "🤝 Nouvelle collaboration",
          message: "Collaboration créée avec Sarah Johnson pour Instagram",
          link: "/collab",
          priority: "high",
          isRead: false
        },
        {
          userId: "DEMO_USER",
          userRole: "video_motion",
          type: "DEADLINE_APPROACHING",
          title: "⏰ Deadline dans 2 jours",
          message: "Le Reel 'Promotion Black Friday' doit être prêt pour le 18 novembre",
          link: "/workflow",
          priority: "high",
          isRead: false
        }
      ];

      const created = await Notification.insertMany(demoNotifications);

      return res.status(201).json({ 
        message: `${created.length} notifications de démo créées`,
        notifications: created 
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

