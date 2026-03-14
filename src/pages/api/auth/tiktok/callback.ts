import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { dbConnect } from "@/lib/db";
import Account from "@/models/Account";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI!;
  try {
    const tokenResp = await axios.post("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    }, { headers: { "Content-Type": "application/json" } });
    const { access_token, refresh_token, expires_in, token_type } = tokenResp.data;
    await dbConnect();
    await Account.findOneAndUpdate(
      { network: "tiktok" },
      { network: "tiktok", accessToken: access_token, refreshToken: refresh_token, tokenType: token_type, expiresAt: new Date(Date.now()+expires_in*1000) },
      { upsert: true }
    );
    res.status(200).send("TikTok connecté. Vous pouvez fermer cette fenêtre.");
  } catch (e:any) {
    res.status(500).send("Erreur OAuth TikTok: " + e.message);
  }
}
