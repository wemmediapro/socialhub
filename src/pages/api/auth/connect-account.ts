import type { NextApiRequest, NextApiResponse } from 'next';

// Temporary storage for OAuth connections (in production, use Redis or database)
const temporaryConnections = new Map<string, { platform: string; accountName?: string; accessToken?: string; userId?: string; createdAt: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { connectAccountSchema } = await import('@/lib/schemas/auth');
    const parsed = connectAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(', ');
      return res.status(400).json({ error: msg });
    }
    const { platform, accountName, accessToken, userId } = parsed.data;
    
    const connectionId = `${Date.now()}_${Math.random()}`;
    
    temporaryConnections.set(connectionId, {
      platform,
      accountName,
      accessToken,
      userId,
      createdAt: Date.now()
    });
    
    // Clean up old connections (older than 10 minutes)
    temporaryConnections.forEach((value, key) => {
      if (Date.now() - value.createdAt > 600000) {
        temporaryConnections.delete(key);
      }
    });
    
    return res.status(200).json({ success: true, connectionId });
  }
  
  if (req.method === 'GET') {
    // Retrieve connection info
    const { connectionId } = req.query;
    
    if (!connectionId || typeof connectionId !== 'string') {
      return res.status(400).json({ error: 'Connection ID required' });
    }
    
    const connection = temporaryConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or expired' });
    }
    
    // Delete after retrieval (one-time use)
    temporaryConnections.delete(connectionId);
    
    return res.status(200).json(connection);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

