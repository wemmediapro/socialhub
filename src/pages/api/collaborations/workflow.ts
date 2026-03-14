import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Collaboration from "@/models/Collaboration";
import { collaborationWorkflowSchema } from "@/lib/schemas/workflow";

type WorkflowStatus =
  | "DRAFT"
  | "PENDING_GRAPHIC"
  | "CLIENT_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "PENDING_CORRECTION"
  | "FAILED";

const statusMapping: Record<string, WorkflowStatus> = {
  DRAFT: "DRAFT",
  PENDING_GRAPHIC: "PENDING_GRAPHIC",
  CLIENT_REVIEW: "CLIENT_REVIEW",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  PENDING_CORRECTION: "PENDING_CORRECTION",
  FAILED: "FAILED",
  PENDING: "DRAFT",
  ACTIVE: "PENDING_GRAPHIC",
  COMPLETED: "PUBLISHED",
  CANCELLED: "FAILED"
};

const normalizeStatusValue = (status: string): WorkflowStatus => {
  const key = (status || "DRAFT").toUpperCase();
  return statusMapping[key] || "DRAFT";
};

const defaultAssignee: Record<WorkflowStatus, string | undefined> = {
  DRAFT: "CLIENT",
  PENDING_GRAPHIC: "INFLUENCER",
  CLIENT_REVIEW: "CLIENT",
  SCHEDULED: "DIGITAL_MARKETER",
  PUBLISHED: undefined,
  PENDING_CORRECTION: "INFLUENCER",
  FAILED: undefined
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
  } catch (dbError: any) {
    console.error("Database connection error in workflow API:", dbError);
    return res.status(500).json({ 
      error: "Erreur de connexion à la base de données",
      details: process.env.NODE_ENV === "development" ? dbError.message : undefined
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = collaborationWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return res.status(400).json({ error: msg });
    }
    const { collabId, action, comment, role, newStatus: requestedNewStatus } = parsed.data;
    
    if (!collabId || !action) {
      return res.status(400).json({ error: "collabId and action are required" });
    }

    const collab = await Collaboration.findById(collabId);
    if (!collab) {
      console.error("Collaboration not found:", collabId);
      return res.status(404).json({ error: "Collaboration not found" });
    }
    
    console.log("Found collaboration:", collab._id, "Current status:", collab.status);

    const normalizedStatus = normalizeStatusValue(collab.status as string);
    if (normalizedStatus !== collab.status) {
      console.log(`Normalizing legacy status "${collab.status}" -> "${normalizedStatus}"`);
      collab.status = normalizedStatus;
    }
    if (!collab.assignedTo) {
      collab.assignedTo = defaultAssignee[normalizedStatus] || collab.assignedTo;
    }

    let newStatus: WorkflowStatus = normalizedStatus;
    let actionNote = "";

    // Workflow transitions
    const isAdmin = role === "ADMIN";
    const originalStatus = collab.status;
    
    switch (action) {
      case "VALIDATE_DRAFT":
        if (collab.status === "DRAFT") {
          newStatus = "PENDING_GRAPHIC";
          collab.assignedTo = "INFLUENCER";
          actionNote = isAdmin 
            ? "Draft validated by admin, assigned to influencer"
            : role === "CLIENT" 
            ? "Draft validated by client, assigned to influencer"
            : "Draft validated by digital marketer, assigned to influencer";
        } else {
          return res.status(400).json({ 
            error: `Cannot validate draft. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      case "VALIDATE_CREATION":
        if (collab.status === "PENDING_GRAPHIC") {
          newStatus = "CLIENT_REVIEW";
          collab.assignedTo = "CLIENT";
          actionNote = isAdmin
            ? "Creation validated by admin, passed to review"
            : role === "CLIENT"
            ? "Creation validated by client, passed to review"
            : "Creation validated by digital marketer, passed to review";
        } else {
          return res.status(400).json({ 
            error: `Cannot validate creation. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      case "SUBMIT_GRAPHIC":
        if (collab.status === "PENDING_GRAPHIC") {
          newStatus = "CLIENT_REVIEW";
          collab.assignedTo = "CLIENT";
          actionNote = isAdmin
            ? "Content uploaded by admin, submitted for client review"
            : "Content uploaded by influencer, submitted for client review";
        } else {
          return res.status(400).json({ 
            error: `Cannot submit content. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      case "APPROVE_REVIEW":
      case "APPROVE_POST": // Support legacy action name
        if (collab.status === "CLIENT_REVIEW") {
          // Initialiser les validations si elles n'existent pas
          if (collab.validatedByClient === undefined) collab.validatedByClient = false;
          if (collab.validatedByDigital === undefined) collab.validatedByDigital = false;
          
          // Mettre à jour la validation selon le rôle
          if (role === "CLIENT" || role === "ADMIN") {
            collab.validatedByClient = true;
          }
          if (role === "DIGITAL_MARKETER" || role === "ADMIN") {
            collab.validatedByDigital = true;
          }
          
          // Si les deux ont validé, passer à SCHEDULED
          if (collab.validatedByClient && collab.validatedByDigital) {
            newStatus = "SCHEDULED";
            collab.assignedTo = "DIGITAL_MARKETER";
            actionNote = isAdmin
              ? "Review approved by admin, scheduled for publication"
              : role === "CLIENT"
              ? "Review approved by client and digital, scheduled for publication"
              : "Review approved by digital marketer and client, scheduled for publication";
          } else {
            // Sinon, rester en CLIENT_REVIEW mais noter la validation
            newStatus = "CLIENT_REVIEW";
            actionNote = role === "CLIENT"
              ? "Review approved by client, waiting for digital validation"
              : "Review approved by digital marketer, waiting for client validation";
          }
        } else {
          return res.status(400).json({ 
            error: `Cannot approve review. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      case "REJECT_REVIEW":
      case "REJECT_POST": // Support legacy action name
        if (collab.status === "CLIENT_REVIEW") {
          // Si newStatus est fourni, l'utiliser, sinon utiliser PENDING_CORRECTION par défaut
          newStatus = (requestedNewStatus && normalizeStatusValue(requestedNewStatus)) || "PENDING_CORRECTION";
          if (newStatus !== "PENDING_CORRECTION") {
            return res.status(400).json({ 
              error: `Invalid newStatus for REJECT_REVIEW. Expected PENDING_CORRECTION, got ${requestedNewStatus}` 
            });
          }
          // Réinitialiser les validations lors du rejet
          collab.validatedByClient = false;
          collab.validatedByDigital = false;
          collab.assignedTo = "INFLUENCER";
          actionNote = isAdmin
            ? "Review rejected by admin, sent for corrections"
            : role === "CLIENT"
            ? "Review rejected by client, sent for corrections"
            : "Review rejected by digital marketer, sent for corrections";
        } else {
          return res.status(400).json({ 
            error: `Cannot reject review. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      case "RESUBMIT_CORRECTION":
        if (collab.status === "PENDING_CORRECTION") {
          newStatus = "CLIENT_REVIEW";
          // Réinitialiser les validations pour un nouveau cycle de révision
          collab.validatedByClient = false;
          collab.validatedByDigital = false;
          collab.assignedTo = "CLIENT";
          actionNote = isAdmin
            ? "Corrections completed by admin, resubmitted for client review"
            : "Corrections completed by influencer, resubmitted for client review";
        } else {
          return res.status(400).json({ 
            error: `Cannot resubmit. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      case "MARK_PUBLISHED":
      case "PUBLISH":
        if (collab.status === "SCHEDULED") {
          // Initialiser les validations si elles n'existent pas
          if (collab.validatedByClient === undefined) collab.validatedByClient = false;
          if (collab.validatedByDigital === undefined) collab.validatedByDigital = false;
          
          // Mettre à jour la validation selon le rôle
          if (role === "CLIENT" || role === "ADMIN") {
            collab.validatedByClient = true;
          }
          if (role === "DIGITAL_MARKETER" || role === "ADMIN") {
            collab.validatedByDigital = true;
          }
          
          // Si les deux ont validé, passer à PUBLISHED
          if (collab.validatedByClient && collab.validatedByDigital) {
            newStatus = "PUBLISHED";
            actionNote = isAdmin
              ? "Collaboration published by admin"
              : role === "CLIENT"
              ? "Collaboration published by client and digital"
              : "Collaboration published by digital marketer and client";
          } else {
            // Sinon, rester en SCHEDULED mais noter la validation
            newStatus = "SCHEDULED";
            actionNote = role === "CLIENT"
              ? "Publication validated by client, waiting for digital validation"
              : "Publication validated by digital marketer, waiting for client validation";
          }
        } else {
          return res.status(400).json({ 
            error: `Cannot mark as published. Collaboration is in status: ${collab.status}` 
          });
        }
        break;

      default:
        return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    // Check if status actually changed (sauf pour les validations partielles)
    // Les validations partielles (APPROVE_REVIEW, MARK_PUBLISHED) peuvent rester dans le même statut
    const isPartialValidation = (action === "APPROVE_REVIEW" || action === "APPROVE_POST" || action === "MARK_PUBLISHED" || action === "PUBLISH") && newStatus === originalStatus;
    
    if (newStatus === originalStatus && actionNote === "" && !isPartialValidation) {
      return res.status(400).json({ 
        error: `Invalid workflow transition. Cannot perform ${action} on collaboration with status ${originalStatus}` 
      });
    }

    // Add comment if provided
    if (comment) {
      // S'assurer que comments existe
      if (!collab.comments) {
        collab.comments = [];
      }
      
      const commentRole = role || "DIGITAL_MARKETER";
      const userName = role === "ADMIN" ? "Admin" : (role || "System");
      
      // Mapper le rôle pour correspondre aux valeurs enum valides
      let validRole: "DIGITAL_MARKETER" | "CLIENT" | "INFLUENCER" | "CREATIVE" = "DIGITAL_MARKETER";
      if (role === "ADMIN" || role === "CLIENT") {
        validRole = "CLIENT";
      } else if (role === "INFLUENCER") {
        validRole = "INFLUENCER";
      } else if (role === "DIGITAL_MARKETER") {
        validRole = "DIGITAL_MARKETER";
      }
      
      const newComment = {
        user: userName,
        role: validRole,
        text: comment,
        createdAt: new Date()
      };
      
      collab.comments.push(newComment);
    }

    // Update status and history
    collab.status = newStatus;
    if (!collab.history) {
      collab.history = [];
    }
    collab.history.push({
      at: new Date(),
      action: action,
      by: role || "system",
      note: actionNote
    });

    console.log("Saving collaboration with new status:", newStatus);
    console.log("Assigned to:", collab.assignedTo);
    
    try {
      await collab.save();
      console.log("Collaboration saved successfully");
    } catch (saveError: any) {
      console.error("Error saving collaboration:", saveError);
      console.error("Error details:", saveError.message);
      console.error("Error stack:", saveError.stack);
      
      // Si c'est une erreur de validation MongoDB, essayer de la contourner
      if (saveError.name === 'ValidationError') {
        const messages = Object.values(saveError.errors).map((e: any) => `${e.path}: ${e.message}`).join(', ');
        return res.status(400).json({ error: `Validation error: ${messages}` });
      }
      
      throw saveError;
    }

    // Convertir le document Mongoose en objet plain pour la réponse
    const collaborationObj = collab.toObject ? collab.toObject() : collab;
    
    res.status(200).json({ success: true, collaboration: collaborationObj });
  } catch (error: any) {
    console.error("Workflow API error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

