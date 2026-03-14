import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Post from "@/models/Post";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json({ post });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      console.log("PATCH /api/posts/[id] - Request body:", JSON.stringify(req.body, null, 2));
      
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Traduction FR → IT caption et description si demandée
      if (req.body.translateToIt === true) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
          try {
            const OpenAI = (await import("openai")).default;
            const openai = new OpenAI({ apiKey });
            const translate = async (text: string) => {
              const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                  role: "user",
                  content: `Traduis le texte suivant du français vers l'italien. Conserve le ton. Réponds UNIQUEMENT par la traduction, sans guillemets.\n\n${text}`,
                }],
                temperature: 0.2,
              });
              return completion.choices[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, "") || "";
            };
            if (post.caption && !post.captionIt) {
              post.captionIt = await translate(post.caption);
              post.markModified("captionIt");
            }
            if (post.description && !post.descriptionIt) {
              post.descriptionIt = await translate(post.description);
              post.markModified("descriptionIt");
            }
          } catch (translateErr: any) {
            console.error("Translate post to IT error:", translateErr);
            return res.status(500).json({
              error: "Erreur lors de la traduction",
              details: process.env.NODE_ENV === "development" ? translateErr.message : undefined,
            });
          }
        }
      }

      // Mettre à jour les champs
      if (req.body.status !== undefined) {
        post.status = req.body.status;
      }
      if (req.body.caption !== undefined) {
        post.caption = req.body.caption;
      }
      if (req.body.description !== undefined) {
        post.description = req.body.description;
      }
      if (req.body.captionIt !== undefined) {
        post.captionIt = req.body.captionIt;
      }
      if (req.body.descriptionIt !== undefined) {
        post.descriptionIt = req.body.descriptionIt;
      }
      if (req.body.mediaUrls !== undefined && Array.isArray(req.body.mediaUrls)) {
        post.mediaUrls = req.body.mediaUrls;
      }
      if (req.body.projectIds !== undefined && Array.isArray(req.body.projectIds)) {
        post.projectIds = req.body.projectIds;
        post.projectId = req.body.projectIds[0] ?? post.projectId;
      }
      if (req.body.projectId !== undefined && !(req.body.projectIds && req.body.projectIds.length > 0)) {
        post.projectId = req.body.projectId;
        post.projectIds = [req.body.projectId];
      }
      if (req.body.scheduledAt !== undefined) {
        post.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : post.scheduledAt;
      }
      if (req.body.insights !== undefined) {
        post.insights = req.body.insights;
      }
      if (req.body.postUrl !== undefined) {
        post.postUrl = req.body.postUrl;
      }
      if (req.body.publishedAt !== undefined) {
        post.publishedAt = req.body.publishedAt ? new Date(req.body.publishedAt) : req.body.publishedAt;
      }
      if (req.body.sentiment !== undefined) {
        post.sentiment = req.body.sentiment;
      }
      if (req.body.statsPlatform !== undefined) {
        post.statsPlatform = req.body.statsPlatform;
      }
      // CRITIQUE: Ajouter le support pour multiPlatformStats
      if (req.body.multiPlatformStats !== undefined) {
        post.multiPlatformStats = req.body.multiPlatformStats.map((stat: any) => {
          const platformStat: any = {
            platform: stat.platform
          };
          
          if (stat.followers !== undefined && stat.followers !== null && stat.followers !== '') {
            platformStat.followers = typeof stat.followers === 'number' ? stat.followers : Number(stat.followers);
          }
          if (stat.postUrl) platformStat.postUrl = stat.postUrl;
          if (stat.sentiment) platformStat.sentiment = stat.sentiment;
          if (stat.publishedAt) {
            platformStat.publishedAt = stat.publishedAt instanceof Date ? stat.publishedAt : new Date(stat.publishedAt);
          }
          
          // Ajouter les insights pour cette plateforme
          if (stat.insights && typeof stat.insights === 'object') {
            platformStat.insights = {};
            Object.keys(stat.insights).forEach(key => {
              const value = stat.insights[key];
              if (value !== null && value !== undefined && value !== '') {
                platformStat.insights[key] = typeof value === 'number' ? value : Number(value);
              }
            });
          }
          
          if (stat.sponsored !== undefined) {
            platformStat.sponsored = stat.sponsored;
          }
          
          return platformStat;
        });
        console.log("Post multiPlatformStats ajoutés:", JSON.stringify(post.multiPlatformStats, null, 2));
      }
      if (req.body.history && Array.isArray(req.body.history)) {
        post.history = req.body.history;
      }

      // Mise à jour des commentaires (ajout de commentaire libre dans le workflow)
      if (req.body.comments !== undefined && Array.isArray(req.body.comments)) {
        post.comments = req.body.comments.map((c: any) => ({
          user: c.user || "User",
          role: ["DIGITAL_MARKETER", "GRAPHIC_DESIGNER", "CLIENT", "ADMIN"].includes(c.role) ? c.role : "DIGITAL_MARKETER",
          text: c.text || "",
          createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)) : new Date()
        }));
      }

      // Sauvegarder
      await post.save();
      
      console.log("Post saved, insights:", JSON.stringify(post.insights, null, 2));
      console.log("Post saved, multiPlatformStats count:", post.multiPlatformStats ? post.multiPlatformStats.length : 0);

      // Retourner le post mis à jour
      const updatedPost = await Post.findById(id).lean();
      return res.status(200).json({ post: updatedPost });
    } catch (e: any) {
      console.error("Error in PATCH /api/posts/[id]:", e);
      return res.status(400).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const post = await Post.findByIdAndDelete(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json({ success: true, message: "Post deleted" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader("Allow", "GET,PATCH,DELETE");
  res.status(405).end();
}
