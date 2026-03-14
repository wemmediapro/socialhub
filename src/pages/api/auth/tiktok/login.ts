import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirect = process.env.TIKTOK_REDIRECT_URI;
  
  // If no credentials configured, use simulator for demo
  if (!clientKey || !redirect || clientKey === 'YOUR_CLIENT_KEY') {
    res.redirect('/oauth-simulator?platform=tiktok');
    return;
  }
  
  // Real OAuth flow
  const encodedRedirect = encodeURIComponent(redirect);
  const state = Math.random().toString(36).slice(2,10);
  const scope = encodeURIComponent("video.publish,video.scope,video.list,user.info.basic");
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodedRedirect}&state=${state}`;
  res.redirect(url);
}
