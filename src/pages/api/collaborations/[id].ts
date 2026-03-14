import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Collaboration from "@/models/Collaboration";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
  } catch (dbError: any) {
    console.error("Database connection error in [id] API:", dbError);
    return res.status(500).json({ 
      error: "Erreur de connexion à la base de données",
      details: process.env.NODE_ENV === "development" ? dbError.message : undefined
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "ID de collaboration requis" });
  }

  if (req.method === "GET") {
    try {
      const collaboration = await Collaboration.findById(id).lean();
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }
      return res.status(200).json({ collaboration });
    } catch (error: any) {
      console.error("Error in GET /api/collaborations/[id]:", error);
      return res.status(500).json({ 
        error: error.message || "Erreur lors de la récupération de la collaboration",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      });
    }
  }

  if (req.method === "PATCH") {
    try {
      const collaboration = await Collaboration.findById(id);
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }

      // Traduction FR → IT de la description si demandée
      if (req.body.translateDescriptionToIt === true) {
        const desc = collaboration.description;
        if (desc && !collaboration.descriptionIt) {
          const apiKey = process.env.OPENAI_API_KEY;
          if (apiKey) {
            try {
              const OpenAI = (await import("openai")).default;
              const openai = new OpenAI({ apiKey });
              const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "user",
                    content: `Traduis le texte suivant du français vers l'italien. Conserve le ton et la structure. Réponds UNIQUEMENT par la traduction, sans guillemets ni explication.\n\nTexte: ${desc}`,
                  },
                ],
                temperature: 0.2,
              });
              const translated =
                completion.choices[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, "") || "";
              if (translated) {
                collaboration.descriptionIt = translated;
                collaboration.markModified("descriptionIt");
              }
            } catch (translateErr: any) {
              console.error("Translate description to IT error:", translateErr);
              return res.status(500).json({
                error: "Erreur lors de la traduction",
                details: process.env.NODE_ENV === "development" ? translateErr.message : undefined,
              });
            }
          }
        }
      }

      // Mettre à jour les champs de base
      if (req.body.status) {
        collaboration.status = req.body.status;
      }
      if (req.body.history && Array.isArray(req.body.history)) {
        collaboration.history = req.body.history;
      }
      if (req.body.influencerId !== undefined) collaboration.influencerId = req.body.influencerId;
      if (req.body.projectId !== undefined) collaboration.projectId = req.body.projectId;
      if (req.body.description !== undefined) collaboration.description = req.body.description;
      if (req.body.descriptionIt !== undefined) collaboration.descriptionIt = req.body.descriptionIt;
      if (req.body.captionFr !== undefined) collaboration.captionFr = req.body.captionFr;
      if (req.body.captionIt !== undefined) collaboration.captionIt = req.body.captionIt;
      if (req.body.contentType !== undefined) collaboration.contentType = req.body.contentType;
      if (req.body.platforms !== undefined && Array.isArray(req.body.platforms)) collaboration.platforms = req.body.platforms;
      if (req.body.startDate !== undefined) collaboration.startDate = req.body.startDate instanceof Date ? req.body.startDate : new Date(req.body.startDate);
      if (req.body.endDate !== undefined) collaboration.endDate = req.body.endDate instanceof Date ? req.body.endDate : new Date(req.body.endDate);
      if (req.body.budget !== undefined) collaboration.budget = Number(req.body.budget);
      // Mise à jour des commentaires (ajout de commentaire libre dans le workflow / collab)
      if (req.body.comments !== undefined && Array.isArray(req.body.comments)) {
        const validRoles = ["DIGITAL_MARKETER", "CLIENT", "INFLUENCER", "CREATIVE"] as const;
        const mapRole = (r: string): typeof validRoles[number] => {
          if (validRoles.includes(r as any)) return r as typeof validRoles[number];
          if (r === "ADMIN") return "CLIENT";
          if (r === "GRAPHIC_DESIGNER") return "CREATIVE";
          return "DIGITAL_MARKETER";
        };
        collaboration.comments = req.body.comments.map((c: any) => ({
          user: c.user || "User",
          role: mapRole(c.role || "DIGITAL_MARKETER"),
          text: c.text || "",
          createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)) : new Date()
        }));
        collaboration.markModified("comments");
      }
      // Mettre à jour contentUploads si présent
      if (req.body.contentUploads && Array.isArray(req.body.contentUploads)) {
        console.log("=== UPDATING CONTENTUPLOADS ===");
        console.log("Incoming contentUploads count:", req.body.contentUploads.length);
        console.log("Full incoming contentUploads:", JSON.stringify(req.body.contentUploads, null, 2));
        
        // Utiliser set() pour forcer la mise à jour complète du tableau
        const newContentUploads = req.body.contentUploads.map((upload: any, index: number) => {
          // Créer un nouvel objet avec tous les champs nécessaires
          const newUpload: any = {
            uploadedBy: upload.uploadedBy || "User",
            role: upload.role || "DIGITAL_MARKETER",
            urls: upload.urls || [],
            description: upload.description || "",
            uploadedAt: upload.uploadedAt ? (upload.uploadedAt instanceof Date ? upload.uploadedAt : new Date(upload.uploadedAt)) : new Date(),
            validatedByClient: upload.validatedByClient !== undefined ? upload.validatedByClient : false
          };
          
          // Ajouter les champs optionnels s'ils existent
          if (upload.scheduledAt) {
            newUpload.scheduledAt = upload.scheduledAt instanceof Date ? upload.scheduledAt : new Date(upload.scheduledAt);
          }
          if (upload.publishedAt) {
            newUpload.publishedAt = upload.publishedAt instanceof Date ? upload.publishedAt : new Date(upload.publishedAt);
          }
          if (upload.platform) {
            newUpload.platform = upload.platform;
          }
          if (upload.sentiment) {
            newUpload.sentiment = upload.sentiment;
          }
          if (upload.postUrl) {
            newUpload.postUrl = upload.postUrl;
          }
          // CRITIQUE: Ajouter les insights s'ils existent
          if (upload.insights && typeof upload.insights === 'object') {
            newUpload.insights = {};
            // Copier chaque clé d'insights
            Object.keys(upload.insights).forEach(key => {
              const value = upload.insights[key];
              if (value !== null && value !== undefined && value !== '') {
                newUpload.insights[key] = typeof value === 'number' ? value : Number(value);
              }
            });
            console.log(`Upload ${index} - Insights ajoutés:`, JSON.stringify(newUpload.insights, null, 2));
          }
          
          // CRITIQUE: Ajouter les platformStats s'ils existent
          if (upload.platformStats && Array.isArray(upload.platformStats)) {
            newUpload.platformStats = upload.platformStats.map((stat: any) => {
              const platformStat: any = {
                platform: stat.platform
              };
              
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
              
              return platformStat;
            });
            console.log(`Upload ${index} - PlatformStats ajoutés:`, JSON.stringify(newUpload.platformStats, null, 2));
          }
          
          // Préserver l'_id si présent (pour MongoDB)
          if (upload._id) {
            newUpload._id = upload._id;
          }
          
          return newUpload;
        });
        
        // Remplacer complètement le tableau
        collaboration.set('contentUploads', newContentUploads);
        collaboration.markModified('contentUploads');
        
        // Vérifier avant sauvegarde
        console.log("ContentUploads après traitement:", JSON.stringify(collaboration.contentUploads.map((u: any) => ({
          _id: u._id ? u._id.toString() : 'no-id',
          hasInsights: !!u.insights,
          insights: u.insights,
          insightsKeys: u.insights ? Object.keys(u.insights) : [],
          hasPlatformStats: !!u.platformStats,
          platformStatsCount: u.platformStats ? u.platformStats.length : 0,
          platformStats: u.platformStats
        })), null, 2));
      }

      // Sauvegarder les modifications
      await collaboration.save();
      
      console.log("=== AFTER SAVE ===");
      console.log("ContentUploads après save:", JSON.stringify(collaboration.contentUploads.map((u: any) => ({
        _id: u._id ? u._id.toString() : 'no-id',
        hasInsights: !!u.insights,
        insights: u.insights ? u.insights.toObject ? u.insights.toObject() : u.insights : null,
        insightsKeys: u.insights ? Object.keys(u.insights) : []
      })), null, 2));

      // Retourner la collaboration mise à jour - utiliser lean() pour avoir un objet JavaScript pur
      const updatedCollaboration = await Collaboration.findById(id).lean();
      
      console.log("=== RETURNING DATA ===");
      console.log("Updated collaboration contentUploads:", JSON.stringify(updatedCollaboration?.contentUploads?.map((u: any) => ({
        hasInsights: !!u.insights,
        insights: u.insights,
        insightsKeys: u.insights ? Object.keys(u.insights) : []
      })), null, 2));
      
      return res.status(200).json({ collaboration: updatedCollaboration });
    } catch (error: any) {
      console.error("Error in PATCH /api/collaborations/[id]:", error);
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e: any) => `${e.path}: ${e.message}`).join(', ');
        return res.status(400).json({ error: `Validation error: ${messages}` });
      }
      return res.status(400).json({ 
        error: error.message || "Erreur lors de la mise à jour de la collaboration"
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const collaboration = await Collaboration.findByIdAndDelete(id);
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }
      return res.status(200).json({ message: "Deleted successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /api/collaborations/[id]:", error);
      return res.status(500).json({ 
        error: error.message || "Erreur lors de la suppression de la collaboration",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      });
    }
  }

  res.setHeader("Allow", "GET,PATCH,DELETE");
  res.status(405).end();
}
