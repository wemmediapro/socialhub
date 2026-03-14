import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Idea from '@/models/Idea';
import { createIdeaSchema } from '@/lib/schemas/ideas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { projectId, status } = req.query;

      const query: Record<string, unknown> = {};
      if (projectId && projectId !== 'all') {
        query.projectIds = projectId;
      }
      if (status && status !== 'all') {
        query.status = status;
      }

      const ideas = await Idea.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ ideas });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsed = createIdeaSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({ error: msg });
      }
      const idea = await Idea.create(parsed.data);
      return res.status(201).json({ idea });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

