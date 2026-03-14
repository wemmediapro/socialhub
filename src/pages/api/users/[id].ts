import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { updateUserSchema } from '@/lib/schemas/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      return res.status(200).json({ user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({ error: msg });
      }
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      const updates = parsed.data;
      Object.assign(user, updates);
      await user.save();
      return res.status(200).json({ user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      return res.status(200).json({ message: 'Utilisateur supprimé' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

