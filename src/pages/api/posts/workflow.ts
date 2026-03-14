import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Post from "@/models/Post";
import { postWorkflowSchema } from "@/lib/schemas/workflow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = postWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return res.status(400).json({ error: msg });
    }
    const { postId, action, comment, role } = parsed.data;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    let newStatus = post.status;
    let actionNote = "";

    // Workflow transitions
    const isAdmin = role === "ADMIN";
    const originalStatus = post.status;
    
    switch (action) {
      case "VALIDATE_DRAFT":
        if (post.status === "DRAFT") {
          newStatus = "PENDING_GRAPHIC";
          post.assignedTo = "GRAPHIC_DESIGNER";
          actionNote = isAdmin 
            ? "Draft validated by admin, assigned to graphic designer"
            : "Draft validated by client, assigned to graphic designer";
        } else {
          return res.status(400).json({ 
            error: `Cannot validate draft. Post is in status: ${post.status}` 
          });
        }
        break;

      case "SUBMIT_GRAPHIC":
        if (post.status === "PENDING_GRAPHIC") {
          newStatus = "CLIENT_REVIEW";
          post.assignedTo = "CLIENT";
          actionNote = isAdmin
            ? "Graphic created by admin, submitted for client review"
            : "Graphic created, submitted for client review";
        }
        break;

      case "APPROVE_POST":
        if (post.status === "CLIENT_REVIEW") {
          newStatus = "SCHEDULED";
          post.assignedTo = null;
          actionNote = isAdmin
            ? "Post approved by admin, scheduled for publication"
            : "Post approved by client, scheduled for publication";
        }
        break;

      case "REJECT_POST":
        if (post.status === "CLIENT_REVIEW") {
          newStatus = "PENDING_CORRECTION";
          post.assignedTo = "GRAPHIC_DESIGNER";
          actionNote = isAdmin
            ? "Post rejected by admin, sent for corrections"
            : "Post rejected by client, sent for corrections";
        }
        break;

      case "RESUBMIT_CORRECTION":
        if (post.status === "PENDING_CORRECTION") {
          newStatus = "CLIENT_REVIEW";
          post.assignedTo = "CLIENT";
          actionNote = isAdmin
            ? "Corrections completed by admin, resubmitted for client review"
            : "Corrections completed, resubmitted for client review";
        }
        break;

      case "MARK_PUBLISHED":
        if (post.status === "SCHEDULED") {
          newStatus = "PUBLISHED";
          actionNote = "Post published to platform";
        }
        break;

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    // Check if status actually changed
    if (newStatus === originalStatus && actionNote === "") {
      return res.status(400).json({ 
        error: `Invalid workflow transition. Cannot perform ${action} on post with status ${originalStatus}` 
      });
    }

    // Add comment if provided
    if (comment) {
      // Use ADMIN role if provided, otherwise default to DIGITAL_MARKETER
      const commentRole = role || "DIGITAL_MARKETER";
      const userName = role === "ADMIN" ? "Admin" : (role || "System");
      
      // Create comment object with proper typing
      const newComment = {
        user: userName,
        role: commentRole as "DIGITAL_MARKETER" | "GRAPHIC_DESIGNER" | "CLIENT" | "ADMIN",
        text: comment,
        createdAt: new Date()
      };
      
      post.comments.push(newComment);
    }

    // Update status and history
    post.status = newStatus;
    post.history.push({
      at: new Date(),
      action: action,
      by: role || "system",
      note: actionNote
    });

    // Save with validation disabled for comments if ADMIN role is used
    // This allows ADMIN to be saved even if the MongoDB schema hasn't been updated yet
    try {
      await post.save();
    } catch (saveError: any) {
      // If validation fails due to ADMIN role, try saving with validation disabled
      if (saveError.message && saveError.message.includes("ADMIN") && saveError.message.includes("enum")) {
        console.warn("ADMIN role not in MongoDB enum, using DIGITAL_MARKETER for comment");
        // Update the last comment to use DIGITAL_MARKETER instead
        if (post.comments.length > 0 && post.comments[post.comments.length - 1].role === "ADMIN") {
          post.comments[post.comments.length - 1].role = "DIGITAL_MARKETER";
        }
        await post.save();
      } else {
        throw saveError;
      }
    }

    res.status(200).json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

