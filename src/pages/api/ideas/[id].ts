import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Idea from '@/models/Idea';
import { updateIdeaSchema } from '@/lib/schemas/ideas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const idea = await Idea.findById(id);
      if (!idea) {
        return res.status(404).json({ error: 'Idée non trouvée' });
      }
      return res.status(200).json({ idea });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const idea = await Idea.findById(id);
      if (!idea) {
        return res.status(404).json({ error: 'Idée non trouvée' });
      }
      if (req.body.translateToIt === true) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey });
          const translate = async (text: string) => {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{
                role: "user",
                content: `Traduis le texte suivant du français vers l'italien. Conserve le ton. Réponds UNIQUEMENT par la traduction, sans guillemets.\n\n${text}`,
              }],
              temperature: 0.2,
            });
            return completion.choices[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, "") || "";
          };
          if (idea.title && !idea.titleIt) {
            idea.titleIt = await translate(idea.title);
            idea.markModified("titleIt");
          }
          if (idea.description && !idea.descriptionIt) {
            idea.descriptionIt = await translate(idea.description);
            idea.markModified("descriptionIt");
          }
          await idea.save();
        }
      }
      const updated = await Idea.findById(id).lean();
      return res.status(200).json({ idea: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const parsed = updateIdeaSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({ error: msg });
      }
      const idea = await Idea.findByIdAndUpdate(id, parsed.data, { new: true });
      if (!idea) {
        return res.status(404).json({ error: 'Idée non trouvée' });
      }
      return res.status(200).json({ idea });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const idea = await Idea.findByIdAndDelete(id);
      if (!idea) {
        return res.status(404).json({ error: 'Idée non trouvée' });
      }
      return res.status(200).json({ message: 'Idée supprimée' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
