import type { NextApiRequest, NextApiResponse } from 'next';
import { sendNotificationEmail } from '@/services/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, name, type } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: 'Email et nom requis' });
      }

      // Test data based on notification type
      const testData: any = {
        POST_CREATED: {
          postDescription: "Nouveau post Instagram - Collection Été 2024",
          scheduledDate: "20 Novembre 2024"
        },
        CONTENT_UPLOADED: {
          postDescription: "Post Instagram - Collection Été 2024",
          creatorName: "Marie (Infographiste)"
        },
        CLIENT_VALIDATED: {
          postDescription: "Post Instagram - Collection Été 2024"
        },
        CLIENT_REJECTED: {
          postDescription: "Post Instagram - Collection Été 2024",
          reason: "Le logo est trop petit, pouvez-vous l'agrandir ?"
        },
        POST_PUBLISHED: {
          postDescription: "Post Instagram - Collection Été 2024",
          reach: 85000,
          likes: 12000,
          engagement: 15000
        },
        DEADLINE_APPROACHING: {
          postDescription: "Reel Instagram - Black Friday",
          daysLeft: 2
        },
        COMMENT_ADDED: {
          commenterName: "Sophie (Digital Créatif)",
          comment: "Excellent travail ! Pouvez-vous juste ajuster la couleur du bouton ?"
        },
        COLLAB_CREATED: {
          projectName: "Summer Campaign 2024",
          budget: 5000
        }
      };

      const result = await sendNotificationEmail(
        email,
        name,
        type || "POST_CREATED",
        testData[type] || testData.POST_CREATED
      );

      if (result.success) {
        return res.status(200).json({ 
          message: 'Email de test envoyé avec succès !',
          ...result 
        });
      } else {
        return res.status(200).json({ 
          message: 'Email simulé (aucun service configuré)',
          details: 'Configurez RESEND_API_KEY ou SENDGRID_API_KEY dans .env.local',
          ...result
        });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

