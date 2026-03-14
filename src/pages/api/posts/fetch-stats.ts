import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

interface StatsResponse {
  views?: number;
  saves?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagement_rate?: number;
  sponsored?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, platform } = req.body;

  if (!url || !platform) {
    return res.status(400).json({ error: 'URL and platform are required' });
  }

  try {
    let stats: StatsResponse = {};

    switch (platform.toLowerCase()) {
      case 'instagram':
        stats = await fetchInstagramStats(url);
        break;
      case 'facebook':
        stats = await fetchFacebookStats(url);
        break;
      case 'tiktok':
        stats = await fetchTikTokStats(url);
        break;
      case 'threads':
        stats = await fetchThreadsStats(url);
        break;
      default:
        return res.status(400).json({ error: 'Platform not supported' });
    }

    return res.status(200).json({ stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
}

// Fonction pour récupérer les statistiques Instagram
async function fetchInstagramStats(url: string): Promise<StatsResponse> {
  try {
    // Méthode 1: Utiliser l'API Graph de Meta (si disponible)
    // Note: Nécessite un access token valide
    // const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    // if (accessToken) {
    //   const postId = extractInstagramPostId(url);
    //   const response = await axios.get(
    //     `https://graph.instagram.com/${postId}?fields=like_count,comments_count&access_token=${accessToken}`
    //   );
    //   return {
    //     likes: response.data.like_count,
    //     comments: response.data.comments_count
    //   };
    // }

    // Méthode 2: Scraping (fallback)
    // Note: Instagram bloque souvent le scraping, cette méthode peut ne pas fonctionner
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    
    // Extraire les données depuis les meta tags ou JSON-LD
    const jsonMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[1]);
      // Parser les données selon la structure Instagram
    }

    // Essayer d'extraire depuis les meta tags
    const likesMatch = html.match(/"like_count":(\d+)/);
    const commentsMatch = html.match(/"comment_count":(\d+)/);
    const viewsMatch = html.match(/"play_count":(\d+)/);

    return {
      likes: likesMatch ? parseInt(likesMatch[1]) : undefined,
      comments: commentsMatch ? parseInt(commentsMatch[1]) : undefined,
      views: viewsMatch ? parseInt(viewsMatch[1]) : undefined
    };
  } catch (error: any) {
    console.error('Error fetching Instagram stats:', error);
    throw new Error('Unable to fetch Instagram statistics. Please enter them manually.');
  }
}

// Fonction pour récupérer les statistiques Facebook
async function fetchFacebookStats(url: string): Promise<StatsResponse> {
  try {
    // Utiliser l'API Graph de Facebook (si disponible)
    // Note: Nécessite un access token valide
    // const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    // if (accessToken) {
    //   const postId = extractFacebookPostId(url);
    //   const response = await axios.get(
    //     `https://graph.facebook.com/v19.0/${postId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${accessToken}`
    //   );
    //   return {
    //     likes: response.data.reactions?.summary?.total_count,
    //     comments: response.data.comments?.summary?.total_count,
    //     shares: response.data.shares?.count
    //   };
    // }

    // Fallback: Scraping (peut ne pas fonctionner)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    
    // Extraire depuis les meta tags ou données structurées
    const reactionsMatch = html.match(/"reaction_count":(\d+)/);
    const commentsMatch = html.match(/"comment_count":(\d+)/);
    const sharesMatch = html.match(/"share_count":(\d+)/);

    return {
      likes: reactionsMatch ? parseInt(reactionsMatch[1]) : undefined,
      comments: commentsMatch ? parseInt(commentsMatch[1]) : undefined,
      shares: sharesMatch ? parseInt(sharesMatch[1]) : undefined
    };
  } catch (error: any) {
    console.error('Error fetching Facebook stats:', error);
    throw new Error('Unable to fetch Facebook statistics. Please enter them manually.');
  }
}

// Fonction pour récupérer les statistiques TikTok
async function fetchTikTokStats(url: string): Promise<StatsResponse> {
  try {
    // TikTok API officielle (si disponible)
    // Note: Nécessite une clé API TikTok
    // const apiKey = process.env.TIKTOK_API_KEY;
    // if (apiKey) {
    //   const videoId = extractTikTokVideoId(url);
    //   const response = await axios.get(
    //     `https://open.tiktokapis.com/v2/research/video/query/?video_id=${videoId}`,
    //     { headers: { 'Authorization': `Bearer ${apiKey}` } }
    //   );
    //   return {
    //     views: response.data.data.video_view_count,
    //     likes: response.data.data.video_like_count,
    //     comments: response.data.data.video_comment_count,
    //     shares: response.data.data.video_share_count
    //   };
    // }

    // Fallback: Scraping (peut ne pas fonctionner car TikTok bloque souvent)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    
    // Extraire depuis les données JSON embarquées
    const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/s);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        // Parser les données selon la structure TikTok
        // Structure peut varier, à adapter selon la réponse réelle
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // Essayer d'extraire depuis les meta tags
    const viewsMatch = html.match(/"playCount":(\d+)/);
    const likesMatch = html.match(/"diggCount":(\d+)/);
    const commentsMatch = html.match(/"commentCount":(\d+)/);
    const sharesMatch = html.match(/"shareCount":(\d+)/);

    return {
      views: viewsMatch ? parseInt(viewsMatch[1]) : undefined,
      likes: likesMatch ? parseInt(likesMatch[1]) : undefined,
      comments: commentsMatch ? parseInt(commentsMatch[1]) : undefined,
      shares: sharesMatch ? parseInt(sharesMatch[1]) : undefined
    };
  } catch (error: any) {
    console.error('Error fetching TikTok stats:', error);
    throw new Error('Unable to fetch TikTok statistics. Please enter them manually.');
  }
}

// Fonction pour récupérer les statistiques Threads
async function fetchThreadsStats(url: string): Promise<StatsResponse> {
  try {
    // Threads utilise l'API Graph de Meta (similaire à Instagram)
    // Note: Nécessite un access token valide
    // const accessToken = process.env.THREADS_ACCESS_TOKEN;
    // if (accessToken) {
    //   const threadId = extractThreadsPostId(url);
    //   const response = await axios.get(
    //     `https://graph.threads.net/v1.0/${threadId}?fields=like_count,reply_count&access_token=${accessToken}`
    //   );
    //   return {
    //     likes: response.data.like_count,
    //     comments: response.data.reply_count
    //   };
    // }

    // Fallback: Scraping
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    
    // Extraire depuis les meta tags ou données structurées
    const likesMatch = html.match(/"like_count":(\d+)/);
    const commentsMatch = html.match(/"reply_count":(\d+)/);

    return {
      likes: likesMatch ? parseInt(likesMatch[1]) : undefined,
      comments: commentsMatch ? parseInt(commentsMatch[1]) : undefined
    };
  } catch (error: any) {
    console.error('Error fetching Threads stats:', error);
    throw new Error('Unable to fetch Threads statistics. Please enter them manually.');
  }
}

// Fonctions utilitaires pour extraire les IDs depuis les URLs (à implémenter selon les besoins)
function extractInstagramPostId(url: string): string | null {
  const match = url.match(/\/p\/([A-Za-z0-9_-]+)/) || url.match(/\/reel\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function extractFacebookPostId(url: string): string | null {
  const match = url.match(/\/posts\/(\d+)/) || url.match(/\/permalink\/(\d+)/);
  return match ? match[1] : null;
}

function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

function extractThreadsPostId(url: string): string | null {
  const match = url.match(/\/post\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

