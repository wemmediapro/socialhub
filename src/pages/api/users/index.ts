import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { createUserSchema } from '@/lib/schemas/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const users = await User.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ users });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({ error: msg });
      }
      const { firstName, lastName, email, phone, role, login, password } = parsed.data;

      const existingUser = await User.findOne({ $or: [{ email }, { login }] });
      if (existingUser) {
        return res.status(400).json({ error: 'Email ou login déjà utilisé' });
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        role,
        login,
        password,
      });

      return res.status(201).json({ user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

