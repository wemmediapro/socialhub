import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { dbConnect } from "@/lib/db";
import Account from "@/models/Account";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = process.env.META_REDIRECT_URI!;

  try {
    await dbConnect();
    
    // Get user access token
    const tokenResp = await axios.get("https://graph.facebook.com/v19.0/oauth_access_token", {
      params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }
    }).catch(async () => {
      // Fallback correct endpoint name
      return await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
        params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }
      });
    });
    
    const userAccessToken = tokenResp.data.access_token;
    console.log("✅ User Access Token obtenu");

    // Get user's pages
    let pagesResp;
    try {
      pagesResp = await axios.get("https://graph.facebook.com/v19.0/me/accounts", {
        params: { 
          access_token: userAccessToken, 
          fields: "id,name,username,access_token,instagram_business_account" 
        }
      });
      console.log(`✅ ${pagesResp.data.data?.length || 0} page(s) trouvée(s)`);
    } catch (pagesError: any) {
      console.error("❌ Erreur lors de la récupération des pages:", pagesError.response?.data || pagesError.message);
      return res.status(500).send(
        `Erreur lors de la récupération des pages: ${pagesError.response?.data?.error?.message || pagesError.message}. ` +
        `Assurez-vous d'avoir autorisé l'accès aux pages (pages_show_list).`
      );
    }

    const pages = pagesResp.data.data || [];
    
    if (pages.length === 0) {
      return res.status(200).send(
        "✅ Meta connecté, mais aucune page Facebook trouvée. " +
        "Assurez-vous d'être administrateur d'au moins une page Facebook."
      );
    }

    // Save each page to database
    let savedCount = 0;
    for (const p of pages) {
      try {
        await Account.findOneAndUpdate(
          { network: "facebook", pageId: p.id },
          { 
            network: "facebook", 
            pageId: p.id, 
            accessToken: p.access_token,
            extra: { name: p.name, username: p.username }
          },
          { upsert: true }
        );
        savedCount++;
        console.log(`✅ Page sauvegardée: ${p.name} (${p.id})`);
        
        // Save Instagram account if connected
        if (p.instagram_business_account?.id) {
          await Account.findOneAndUpdate(
            { network: "instagram", igUserId: p.instagram_business_account.id },
            { 
              network: "instagram", 
              igUserId: p.instagram_business_account.id, 
              accessToken: p.access_token, 
              extra: { pageId: p.id, pageName: p.name } 
            },
            { upsert: true }
          );
          console.log(`✅ Compte Instagram sauvegardé: ${p.instagram_business_account.id}`);
        }
      } catch (saveError: any) {
        console.error(`❌ Erreur lors de la sauvegarde de la page ${p.id}:`, saveError.message);
      }
    }

    res.status(200).send(
      `✅ Meta connecté ! ${savedCount} compte(s) synchronisé(s). ` +
      `Vous pouvez fermer cette fenêtre.`
    );
  } catch (e:any) {
    console.error("❌ Erreur OAuth Meta:", e.message, e.response?.data);
    res.status(500).send(
      `Erreur OAuth Meta: ${e.response?.data?.error?.message || e.message}. ` +
      `Vérifiez les logs du serveur pour plus de détails.`
    );
  }
}
