import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import mongoose from "mongoose";
import Collaboration from "@/models/Collaboration";
import { z } from "zod";

const CreateSchema = z.object({
  influencerId: z.string(),
  projectId: z.string(),
  description: z.string(),
  descriptionIt: z.string().optional(),
  captionFr: z.string().optional(),
  captionIt: z.string().optional(),
  contentType: z.enum(["reel", "story"]).optional(),
  platforms: z.array(z.enum(["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"])).optional(),
  budget: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string().optional(),
  createdBy: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
  } catch (dbError: any) {
    console.error("Database connection error:", dbError);
    return res.status(500).json({ 
      error: "Erreur de connexion à la base de données",
      details: process.env.NODE_ENV === "development" ? dbError.message : undefined
    });
  }
  
  // Utiliser le modèle Collaboration importé normalement
  // Le modèle devrait déjà avoir le bon schéma grâce à la suppression dans le fichier modèle
  const CollaborationModel = Collaboration;

  if (req.method === "GET") {
    try {
      const { projectId, influencerId } = req.query;
      const filter: any = {};
      if (projectId) filter.projectId = projectId;
      if (influencerId) filter.influencerId = influencerId;
      
      const collaborations = await CollaborationModel.find(filter).sort({ createdAt: -1 });
      const now = new Date();
      const autoUpdatePromises: Promise<any>[] = [];

      collaborations.forEach(collab => {
        try {
          const status = (collab.status || "").toString().toUpperCase();
          if (status === "SCHEDULED") {
            const candidateDates: Date[] = [];

            // Collect potential publication dates
            const rootScheduledAt = (collab as any).scheduledAt;
            if (rootScheduledAt) {
              const rootDate = new Date(rootScheduledAt);
              if (!isNaN(rootDate.getTime())) candidateDates.push(rootDate);
            }

            if (collab.endDate && !isNaN(collab.endDate.getTime())) {
              candidateDates.push(collab.endDate);
            }

            if (collab.startDate && !isNaN(collab.startDate.getTime())) {
              candidateDates.push(collab.startDate);
            }

            let uploadsUpdated = false;
            if (Array.isArray(collab.contentUploads)) {
              collab.contentUploads.forEach(upload => {
                if (upload?.scheduledAt && !isNaN(upload.scheduledAt.getTime())) {
                  candidateDates.push(upload.scheduledAt);
                }
              });
            }

            const publishDate = candidateDates
              .filter(date => date && !isNaN(date.getTime()))
              .sort((a, b) => a.getTime() - b.getTime())[0];

            if (publishDate && publishDate.getTime() <= now.getTime()) {
              collab.status = "PUBLISHED" as any;

              if (!Array.isArray(collab.history)) {
                collab.history = [];
              }

              collab.history.push({
                action: "auto_publish",
                by: "SYSTEM",
                note: "Statut automatiquement passé à PUBLISHED car la date planifiée est dépassée",
                at: now
              });

              if (Array.isArray(collab.contentUploads)) {
                collab.contentUploads.forEach(upload => {
                  if (
                    upload &&
                    upload.scheduledAt &&
                    !isNaN(upload.scheduledAt.getTime()) &&
                    !upload.publishedAt &&
                    upload.scheduledAt.getTime() <= now.getTime()
                  ) {
                    upload.publishedAt = now;
                    uploadsUpdated = true;
                  }
                });

                if (uploadsUpdated) {
                  collab.markModified("contentUploads");
                }
              }

              autoUpdatePromises.push(collab.save());
            }
          }
        } catch (collabError: any) {
          console.error(`Error processing collaboration ${collab._id}:`, collabError);
          // Continue processing other collaborations
        }
      });

      if (autoUpdatePromises.length > 0) {
        await Promise.all(autoUpdatePromises);
        const updatedCollaborations = await CollaborationModel.find(filter).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ collaborations: updatedCollaborations });
      }

      return res.status(200).json({ collaborations: collaborations.map(collab => collab.toObject()) });
    } catch (error: any) {
      console.error("Error in GET /api/collaborations:", error);
      console.error("Error stack:", error.stack);
      return res.status(500).json({ 
        error: error.message || "Erreur lors de la récupération des collaborations",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      });
    }
  }

  if (req.method === "POST") {
    try {
      console.log("POST /api/collaborations - Request body:", JSON.stringify(req.body, null, 2));
      
      const data = CreateSchema.parse(req.body);
      console.log("Parsed data:", JSON.stringify(data, null, 2));
      
      // Convertir les dates en objets Date
      // Le format HTML date input est YYYY-MM-DD
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      console.log("Parsed dates - startDate:", startDate, "endDate:", endDate);
      
      // Validation des dates
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: `Date de début invalide: ${data.startDate}` });
      }
      
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: `Date de fin invalide: ${data.endDate}` });
      }
      
      if (endDate < startDate) {
        return res.status(400).json({ error: "La date de fin doit être après la date de début" });
      }
      
      // Validation du budget
      if (data.budget <= 0) {
        return res.status(400).json({ error: "Le budget doit être positif" });
      }
      
      // Validation des champs requis
      if (!data.influencerId || !data.projectId || !data.description) {
        return res.status(400).json({ error: "L'influenceur, le projet et la description sont requis" });
      }
      
      const collaborationData: any = {
        influencerId: data.influencerId,
        projectId: data.projectId,
        description: data.description.trim(),
        descriptionIt: data.descriptionIt?.trim() || undefined,
        captionFr: data.captionFr?.trim() || undefined,
        captionIt: data.captionIt?.trim() || undefined,
        contentType: data.contentType || undefined,
        platforms: Array.isArray(data.platforms) && data.platforms.length > 0 ? data.platforms : undefined,
        budget: data.budget,
        startDate: startDate,
        endDate: endDate,
        status: data.status || "DRAFT",
        createdBy: data.createdBy || "User"
      };
      
      // Ajouter assignedTo seulement pour DRAFT
      if ((data.status || "DRAFT") === "DRAFT") {
        collaborationData.assignedTo = "CLIENT";
      }
      
      console.log("Creating collaboration with data:", JSON.stringify(collaborationData, null, 2));
      
      const collaboration = await CollaborationModel.create(collaborationData);
      
      console.log("Collaboration created successfully:", collaboration._id);
      
      return res.status(201).json({ collaboration });
    } catch (error: any) {
      console.error("Error creating collaboration:", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      // Si c'est une erreur de validation Zod
      if (error.name === 'ZodError') {
        const zodErrors = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({ error: `Validation error: ${zodErrors}` });
      }
      // Si c'est une erreur de validation MongoDB
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e: any) => `${e.path}: ${e.message}`).join(', ');
        return res.status(400).json({ error: `MongoDB validation error: ${messages}` });
      }
      // Autres erreurs MongoDB
      if (error.code === 11000) {
        return res.status(400).json({ error: "Une collaboration similaire existe déjà" });
      }
      return res.status(400).json({ error: error.message || "Erreur lors de la création de la collaboration" });
    }
  }

  res.setHeader("Allow", "GET,POST");
  res.status(405).end();
}
