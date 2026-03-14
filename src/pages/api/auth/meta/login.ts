import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const appId = process.env.META_APP_ID;
  const redirect = process.env.META_REDIRECT_URI;
  
  // If no credentials configured, use simulator for demo
  if (!appId || !redirect || appId === 'YOUR_APP_ID') {
    res.redirect('/oauth-simulator?platform=meta');
    return;
  }
  
  // Real OAuth flow
  // Using valid scopes according to Facebook Graph API v19
  // For development mode, we use ONLY the most basic permissions that work without App Review
  const encodedRedirect = encodeURIComponent(redirect);
  const state = Math.random().toString(36).slice(2,10);
  
  // Valid scopes for Facebook Pages (work in development mode WITHOUT App Review):
  // - pages_show_list: List user's Facebook pages (basic permission)
  // - pages_read_engagement: Read page engagement metrics (basic permission)
  // Note: pages_read_user_content requires App Review and is not available in dev mode
  // Note: For Instagram, permissions are granted through the connected Facebook Page
  const scope = encodeURIComponent(
    "pages_show_list " +
    "pages_read_engagement"
  );
  
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodedRedirect}&state=${state}&scope=${scope}`;
  res.redirect(url);
}
