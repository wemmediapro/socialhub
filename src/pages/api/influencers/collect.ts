import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { dbConnect } from "@/lib/db";
import Account from "@/models/Account";

interface SocialMediaData {
  followers: number;
  avgEngagementRate: number;
  reach: number;
  avgViews: number;
  handle?: string;
  error?: string;
  source?: "api" | "openai_estimate";
}

/**
 * Estimate followers and engagement using OpenAI when no API is available.
 * Uses platform + handle + optional influencer name for context.
 */
async function estimateWithOpenAI(
  platform: string,
  handle: string,
  influencerName?: string
): Promise<SocialMediaData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY non configuré. Ajoutez-le dans .env pour utiliser l'estimation OpenAI.");
  }

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey });

  const prompt = `Tu es un assistant qui estime les métriques de médias sociaux pour un profil.

Plateforme: ${platform}
Handle / nom d'utilisateur: ${handle || "(non fourni)"}
${influencerName ? `Nom de l'influenceur ou de la page: ${influencerName}` : ""}

À partir de ces informations, estime de manière plausible (sans accès en temps réel aux plateformes):
- Le nombre de followers typique pour ce type de profil (ordre de grandeur réaliste: micro-influenceur 1K-50K, mid-tier 50K-500K, macro 500K+). Si le handle ressemble à un compte personnel ou une marque, adapte.
- Le taux d'engagement moyen en % (généralement entre 1% et 10% selon la plateforme et la taille du compte).

Réponds UNIQUEMENT par un objet JSON valide (pas de markdown, pas de texte autour) avec exactement:
{ "followers": <nombre entier>, "avgEngagementRate": <nombre décimal pour le % ex: 2.5> }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "{}";
  let parsed: { followers?: number; avgEngagementRate?: number };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse OpenAI invalide pour l'estimation.");
  }

  const followers = Math.max(0, Math.round(Number(parsed.followers) || 0));
  const avgEngagementRate = Math.min(100, Math.max(0, Number(parsed.avgEngagementRate) || 2.5));

  return {
    followers,
    avgEngagementRate,
    reach: Math.floor(followers * 0.3),
    avgViews: Math.floor(followers * 0.15),
    handle: handle || undefined,
    source: "openai_estimate",
  };
}

/**
 * Extract username/handle from URL
 */
function extractHandle(url: string, platform: string): string {
  try {
    // Clean URL - remove duplicate https://www if present
    let cleanUrl = url.replace(/https?:\/\/www\.?https?:\/\/www\.?/gi, 'https://www.');
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    const urlObj = new URL(cleanUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    if (platform === 'instagram') {
      return pathParts[0] || url.replace(/[@\/]/g, '');
    } else if (platform === 'facebook') {
      // For Facebook, extract the page username or ID
      // Examples: 
      // - https://www.facebook.com/Omardizer -> Omardizer
      // - https://www.facebook.com/pages/Omardizer/123456 -> Omardizer
      // - https://www.facebook.com/profile.php?id=123456 -> 123456
      
      if (urlObj.pathname.includes('/pages/')) {
        // Format: /pages/PageName/ID
        return pathParts[1] || pathParts[0] || url.replace(/[@\/]/g, '');
      } else if (urlObj.pathname.includes('profile.php')) {
        // Format: /profile.php?id=123456
        const idParam = urlObj.searchParams.get('id');
        return idParam || pathParts[0] || url.replace(/[@\/]/g, '');
      } else {
        // Standard format: /PageName
        return pathParts[0] || pathParts[pathParts.length - 1] || url.replace(/[@\/]/g, '');
      }
    } else if (platform === 'tiktok') {
      return pathParts[0]?.replace('@', '') || url.replace(/[@\/]/g, '');
    } else if (platform === 'youtube') {
      if (urlObj.pathname.includes('/channel/')) {
        return pathParts[pathParts.length - 1];
      } else if (urlObj.pathname.includes('/user/')) {
        return pathParts[pathParts.length - 1];
      } else if (urlObj.pathname.includes('/c/')) {
        return pathParts[pathParts.length - 1];
      } else {
        return pathParts[0] || url.replace(/[@\/]/g, '');
      }
    }
    return pathParts[0] || url.replace(/[@\/]/g, '');
  } catch {
    // Fallback: clean the URL manually
    return url.replace(/https?:\/\/(www\.)?facebook\.com\//gi, '').replace(/[@\/]/g, '').split('?')[0];
  }
}

/**
 * Collect Instagram data using scraping
 */
async function collectInstagramData(
  url: string,
  handle: string,
  influencerName?: string
): Promise<SocialMediaData> {
  try {
    // Option 1: Use RapidAPI Instagram Scraper (if you have an API key)
    if (process.env.RAPIDAPI_KEY) {
      try {
        const response = await axios.get(`https://instagram-scraper-api2.p.rapidapi.com/userinfo/${handle}`, {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
          },
          timeout: 10000
        });
        
        const followerCount = response.data.follower_count || response.data.followers || 0;
        const engagementRate = response.data.engagement_rate || 2.5; // Default if not provided
        
        return {
          followers: followerCount,
          avgEngagementRate: engagementRate,
          reach: Math.floor(followerCount * 0.3),
          avgViews: response.data.avg_views || Math.floor(followerCount * 0.15),
          handle: handle
        };
      } catch (rapidApiError: any) {
        console.error("RapidAPI Instagram error:", rapidApiError.message);
        // Fall through to OpenAI estimate
      }
    }

    // Fallback: estimate with OpenAI if API key is present
    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("instagram", handle, influencerName);
    }
    
    throw new Error("Instagram : configurez RAPIDAPI_KEY ou OPENAI_API_KEY dans .env, ou saisissez les données manuellement.");
    
  } catch (error: any) {
    if (error.message?.includes("OPENAI_API_KEY") || error.message?.includes("Réponse OpenAI")) throw error;
    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("instagram", handle, influencerName);
    }
    throw error;
  }
}

/**
 * Collect Facebook data using Graph API or scraping
 */
async function collectFacebookData(url: string, handle: string): Promise<SocialMediaData> {
  try {
    await dbConnect();
    
    // Clean the handle - remove any remaining URL parts
    let pageId = handle.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '').replace(/\/$/, '');
    
    // Option 1: Try to use Page Access Tokens from connected accounts (OAuth)
    // This is the preferred method as it works for pages the user manages
    const connectedAccounts = await Account.find({ 
      network: 'facebook',
      accessToken: { $exists: true, $ne: null }
    });
    
    if (connectedAccounts.length > 0) {
      // Try to find the page in connected accounts
      for (const account of connectedAccounts) {
        if (account.pageId && account.accessToken) {
          try {
            // First, get page info to check if it matches
            const pageInfo = await axios.get(`https://graph.facebook.com/v19.0/${account.pageId}`, {
              params: {
                fields: 'id,name,username,followers_count,fan_count',
                access_token: account.accessToken
              },
              timeout: 10000
            });
            
            const pageData = pageInfo.data;
            const pageUsername = pageData.username?.toLowerCase();
            const pageName = pageData.name?.toLowerCase();
            const searchTerm = pageId.toLowerCase();
            
            // Check if this page matches (by ID, username, or name)
            if (
              account.pageId === pageId ||
              pageUsername === searchTerm ||
              pageName?.includes(searchTerm) ||
              searchTerm.includes(pageUsername || '')
            ) {
              const followers = pageData.followers_count || pageData.fan_count || 0;
              
              return {
                followers: followers,
                avgEngagementRate: 2.5,
                reach: Math.floor(followers * 0.25),
                avgViews: Math.floor(followers * 0.15),
                handle: pageData.name || pageData.username || handle
              };
            }
          } catch (accountError: any) {
            console.error(`Error checking account ${account.pageId}:`, accountError.message);
            // Continue to next account
            continue;
          }
        }
      }
      
      // If no exact match, try to search through all connected pages
      for (const account of connectedAccounts) {
        if (account.accessToken) {
          try {
            // Try to get page by username using the Page Access Token
            const pageInfo = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
              params: {
                fields: 'id,followers_count,fan_count,name',
                access_token: account.accessToken
              },
              timeout: 10000
            });
            
            const followers = pageInfo.data.followers_count || pageInfo.data.fan_count || 0;
            
            if (followers > 0 || pageInfo.data.id) {
              return {
                followers: followers,
                avgEngagementRate: 2.5,
                reach: Math.floor(followers * 0.25),
                avgViews: Math.floor(followers * 0.15),
                handle: pageInfo.data.name || handle
              };
            }
          } catch (searchError: any) {
            // Continue to next account
            continue;
          }
        }
      }
    }
    
    // Option 2: Try to get access token from environment or generate App Access Token
    let accessToken: string | undefined = process.env.FACEBOOK_ACCESS_TOKEN;
    
    // Generate App Access Token from META_APP_ID and META_APP_SECRET
    if (!accessToken && process.env.META_APP_ID && process.env.META_APP_SECRET) {
      try {
        const appTokenResponse = await axios.get(
          `https://graph.facebook.com/v19.0/oauth/access_token`,
          {
            params: {
              client_id: process.env.META_APP_ID,
              client_secret: process.env.META_APP_SECRET,
              grant_type: 'client_credentials'
            },
            timeout: 5000
          }
        );
        accessToken = appTokenResponse.data.access_token;
      } catch (tokenError: any) {
        console.error("Error generating App Access Token:", tokenError.message);
      }
    }
    
    // Option 2: Use provided FACEBOOK_ACCESS_TOKEN or App Access Token
    if (accessToken) {
      // Extract page ID from URL or handle
      // For Facebook pages, we need the page username or ID
      let pageId = handle;
      
      // Clean the handle - remove any remaining URL parts
      pageId = pageId.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '').replace(/\/$/, '');
      
      // Try multiple methods to get page data
      const methods = [];
      
      // Method 1: Direct lookup by username (if not numeric)
      if (!pageId.match(/^\d+$/)) {
        methods.push({
          name: 'username',
          endpoint: `https://graph.facebook.com/v19.0/${pageId}`,
          params: { fields: 'id,followers_count,fan_count,name', access_token: accessToken }
        });
      }
      
      // Method 2: Search for the page by name (if username lookup fails)
      if (!pageId.match(/^\d+$/)) {
        methods.push({
          name: 'search',
          endpoint: `https://graph.facebook.com/v19.0/search`,
          params: { 
            q: pageId, 
            type: 'page',
            fields: 'id,followers_count,fan_count,name',
            access_token: accessToken,
            limit: 1
          }
        });
      }
      
      // Method 3: Direct lookup by page ID (if numeric)
      if (pageId.match(/^\d+$/)) {
        methods.push({
          name: 'pageId',
          endpoint: `https://graph.facebook.com/v19.0/${pageId}`,
          params: { fields: 'id,followers_count,fan_count,name', access_token: accessToken }
        });
      }
      
      // Try each method until one works
      for (const method of methods) {
        try {
          const response = await axios.get(method.endpoint, {
            params: method.params,
            timeout: 10000
          });
          
          let pageData;
          let followers = 0;
          
          if (method.name === 'search') {
            // Search returns an array
            if (response.data.data && response.data.data.length > 0) {
              pageData = response.data.data[0];
              followers = pageData.followers_count || pageData.fan_count || 0;
            } else {
              continue; // Try next method
            }
          } else {
            // Direct lookup returns the page object
            pageData = response.data;
            followers = pageData.followers_count || pageData.fan_count || 0;
          }
          
          if (followers > 0 || pageData.id) {
            return {
              followers: followers,
              avgEngagementRate: 2.5, // Average Facebook engagement rate
              reach: Math.floor(followers * 0.25), // Estimated reach
              avgViews: Math.floor(followers * 0.15), // Estimated views
              handle: pageData.name || handle
            };
          }
        } catch (apiError: any) {
          console.error(`Facebook Graph API error (${method.name}):`, apiError.response?.data || apiError.message);
          // Continue to next method
          continue;
        }
      }
      
      // All methods failed
      const errorDetails = methods.length > 0 
        ? `Tentatives: ${methods.map(m => m.name).join(', ')}`
        : 'Aucune méthode disponible';
      
      if (process.env.OPENAI_API_KEY) {
        return await estimateWithOpenAI("facebook", handle);
      }
      
      // Check if user has connected accounts
      const hasConnectedAccounts = connectedAccounts.length > 0;
      
      if (hasConnectedAccounts) {
        throw new Error(
          `Impossible de récupérer les données de la page Facebook "${pageId}". ` +
          `La page n'a pas été trouvée parmi vos pages connectées. ` +
          `Assurez-vous que la page est bien connectée via OAuth et que vous avez les permissions nécessaires. ` +
          `Vérifiez vos comptes connectés: /api/test/facebook`
        );
      } else {
        throw new Error(
          `Impossible de récupérer les données de la page Facebook "${pageId}". ` +
          `Aucun compte Facebook connecté. ` +
          `Connectez d'abord votre compte via OAuth: /api/auth/meta/login`
        );
      }
    }
    
    // No access token available
    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("facebook", handle);
    }
    
    throw new Error(
      "Facebook data collection requires:" +
      "\n• Connexion OAuth via /api/auth/meta/login (recommandé)" +
      "\n• Ou META_APP_ID et META_APP_SECRET dans .env (limité aux pages publiques)"
    );
    
  } catch (error: any) {
    console.error("Facebook collection error:", error.message);
    throw error;
  }
}

/**
 * Collect TikTok data
 */
async function collectTikTokData(
  url: string,
  handle: string,
  influencerName?: string
): Promise<SocialMediaData> {
  try {
    if (process.env.RAPIDAPI_KEY) {
      try {
        const response = await axios.get(`https://tiktok-scraper2.p.rapidapi.com/user/info`, {
          params: { username: handle.replace('@', '') },
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'tiktok-scraper2.p.rapidapi.com'
          },
          timeout: 10000
        });
        
        const followerCount = response.data.followerCount || response.data.followers || 0;
        const engagementRate = response.data.engagement_rate || 5.0;
        
        return {
          followers: followerCount,
          avgEngagementRate: engagementRate,
          reach: Math.floor(followerCount * 0.4),
          avgViews: response.data.avgViews || Math.floor(followerCount * 0.2),
          handle: handle
        };
      } catch (rapidApiError: any) {
        console.error("RapidAPI TikTok error:", rapidApiError.message);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("tiktok", handle, influencerName);
    }
    
    throw new Error("TikTok : configurez RAPIDAPI_KEY ou OPENAI_API_KEY dans .env, ou saisissez les données manuellement.");
    
  } catch (error: any) {
    if (error.message?.includes("OPENAI_API_KEY") || error.message?.includes("Réponse OpenAI")) throw error;
    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("tiktok", handle, influencerName);
    }
    throw error;
  }
}

/**
 * Collect YouTube data using YouTube Data API v3
 */
async function collectYouTubeData(
  url: string,
  handle: string,
  influencerName?: string
): Promise<SocialMediaData> {
  try {
    if (process.env.YOUTUBE_API_KEY) {
      let channelId = handle;
      
      if (!channelId.startsWith('UC')) {
        try {
          const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              part: 'snippet',
              q: handle,
              type: 'channel',
              maxResults: 1,
              key: process.env.YOUTUBE_API_KEY
            }
          });
          
          if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            channelId = searchResponse.data.items[0].snippet.channelId;
          }
        } catch (searchError) {
          console.error("YouTube search error:", searchError);
        }
      }
      
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'statistics,snippet',
          id: channelId,
          key: process.env.YOUTUBE_API_KEY
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const stats = response.data.items[0].statistics;
        const subscribers = parseInt(stats.subscriberCount || '0');
        const viewCount = parseInt(stats.viewCount || '0');
        const videoCount = parseInt(stats.videoCount || '0');
        const avgViews = videoCount > 0 ? Math.floor(viewCount / videoCount) : 0;
        const avgEngagementRate = 2.0;
        
        return {
          followers: subscribers,
          avgEngagementRate: avgEngagementRate,
          reach: Math.floor(subscribers * 0.3),
          avgViews: avgViews,
          handle: handle
        };
      }
    }

    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("youtube", handle, influencerName);
    }
    
    throw new Error("YouTube : configurez YOUTUBE_API_KEY ou OPENAI_API_KEY dans .env, ou saisissez les données manuellement.");
    
  } catch (error: any) {
    if (error.message?.includes("OPENAI_API_KEY") || error.message?.includes("Réponse OpenAI")) throw error;
    if (process.env.OPENAI_API_KEY) {
      return await estimateWithOpenAI("youtube", handle, influencerName);
    }
    throw error;
  }
}

/**
 * Main handler for collecting social media data
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { platform, url, influencerName } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ error: "Platform and URL are required" });
    }

    const handle = extractHandle(url, platform);
    
    let data: SocialMediaData;

    switch (platform.toLowerCase()) {
      case 'instagram':
        data = await collectInstagramData(url, handle, influencerName);
        break;
      case 'facebook':
        data = await collectFacebookData(url, handle);
        break;
      case 'tiktok':
        data = await collectTikTokData(url, handle, influencerName);
        break;
      case 'youtube':
        data = await collectYouTubeData(url, handle, influencerName);
        break;
      case 'x':
      case 'twitter':
        if (process.env.OPENAI_API_KEY) {
          data = await estimateWithOpenAI("x", handle, influencerName);
        } else {
          return res.status(501).json({ 
            error: "Twitter/X : configurez OPENAI_API_KEY dans .env pour une estimation, ou saisissez manuellement." 
          });
        }
        break;
      case 'snapchat':
        if (process.env.OPENAI_API_KEY) {
          data = await estimateWithOpenAI("snapchat", handle, influencerName);
        } else {
          return res.status(501).json({ 
            error: "Snapchat : configurez OPENAI_API_KEY dans .env pour une estimation." 
          });
        }
        break;
      case 'linkedin':
        if (process.env.OPENAI_API_KEY) {
          data = await estimateWithOpenAI("linkedin", handle, influencerName);
        } else {
          return res.status(501).json({ 
            error: "LinkedIn : configurez OPENAI_API_KEY dans .env pour une estimation." 
          });
        }
        break;
      case 'threads':
        if (process.env.OPENAI_API_KEY) {
          data = await estimateWithOpenAI("threads", handle, influencerName);
        } else {
          return res.status(501).json({ 
            error: "Threads : configurez OPENAI_API_KEY dans .env pour une estimation." 
          });
        }
        break;
      default:
        return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    return res.status(200).json({ 
      success: true,
      data: {
        ...data,
        handle: data.handle || handle
      }
    });

  } catch (error: any) {
    console.error("Error collecting social media data:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to collect social media data",
      details: error.message
    });
  }
}

