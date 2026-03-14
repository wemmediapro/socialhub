import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const targetEmail = 'admin@mediapro.com';
    const defaultPassword = 'admin123';

    // Find or create admin
    let user = await User.findOne({ email: targetEmail }).exec();

    if (!user) {
      user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: targetEmail,
        login: 'admin',
        password: defaultPassword,
        role: 'admin',
        isActive: true,
        projectIds: [],
        notifications: { email: true, push: false }
      });
    } else {
      // Ensure admin role, active state, and reset password (plain for now)
      user.role = 'admin' as any;
      user.isActive = true as any;
      // NOTE: Passwords are stored in plain text in this project currently
      user.password = defaultPassword as any;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Admin user ensured/reset',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error: any) {
    console.error('Error in reset-admin:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}






