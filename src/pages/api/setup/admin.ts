import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          firstName: existingAdmin.firstName,
          lastName: existingAdmin.lastName
        }
      });
    }

    // Create default admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@mediapro.com',
      login: 'admin',
      password: 'admin123', // In production, this should be hashed!
      role: 'admin',
      isActive: true,
      projectIds: [],
      notifications: {
        email: true,
        push: false
      }
    });

    return res.status(201).json({ 
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      }
    });

  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({ error: error.message });
  }
}
