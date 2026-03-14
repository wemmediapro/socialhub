import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/db';
import Account from '@/models/Account';
import axios from 'axios';

interface TestResult {
  accountId: any;
  network: string;
  pageId?: string;
  igUserId?: string;
  hasToken: boolean;
  status: string;
  data?: any;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if Meta credentials are configured
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    const configStatus = {
      hasAppId: !!appId && appId !== 'votre_app_id',
      hasAppSecret: !!appSecret && appSecret !== 'votre_app_secret', 
      hasRedirectUri: !!redirectUri,
      appId: appId || 'Not configured'
    };

    // Get connected accounts
    const accounts = await Account.find({ network: { $in: ['facebook', 'instagram'] } });

    const accountTests = await Promise.all(accounts.map(async (account) => {
      try {
        let testResult: TestResult = {
          accountId: account._id,
          network: account.network,
          pageId: account.pageId,
          igUserId: account.igUserId,
          hasToken: !!account.accessToken,
          status: 'unknown'
        };

        if (account.accessToken) {
          // Test the token with Facebook Graph API
          const fields = account.network === 'facebook' 
            ? 'id,name,category' 
            : 'id,username,account_type';

          const endpoint = account.network === 'facebook'
            ? `https://graph.facebook.com/v19.0/${account.pageId}`
            : `https://graph.facebook.com/v19.0/${account.igUserId}`;

          const response = await axios.get(endpoint, {
            params: {
              access_token: account.accessToken,
              fields: fields
            },
            timeout: 10000
          });

          testResult.status = 'active';
          testResult.data = response.data;
        } else {
          testResult.status = 'no_token';
        }

        return testResult;
      } catch (error: any) {
        return {
          accountId: account._id,
          network: account.network,
          pageId: account.pageId,
          igUserId: account.igUserId,
          hasToken: !!account.accessToken,
          status: 'error',
          error: error.message
        };
      }
    }));

    return res.status(200).json({
      success: true,
      config: configStatus,
      accounts: accounts.length,
      tests: accountTests,
      message: accounts.length === 0 
        ? 'Aucun compte Facebook/Instagram connecté. Utilisez /api/auth/meta/login pour connecter.'
        : `${accounts.length} compte(s) trouvé(s)`
    });

  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
