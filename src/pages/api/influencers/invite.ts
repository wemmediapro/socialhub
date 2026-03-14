import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Influencer from "@/models/Influencer";
import { sendNotificationEmail } from "@/services/emailService";
import { inviteInfluencerSchema } from "@/lib/schemas/influencers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const parsed = inviteInfluencerSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ error: msg });
    }
    const { email, name, projectId, message } = parsed.data;

    // Check if influencer already exists
    let influencer = await Influencer.findOne({ email });

    if (!influencer) {
      // Create new influencer
      influencer = await Influencer.create({
        name,
        email,
        platform: "instagram", // Default
        followers: 0,
        category: "general",
        bio: "",
        status: "pending", // Pending until they accept
        invitedAt: new Date(),
        invitedToProjectId: projectId
      });
    }

    // Send invitation email
    try {
      await sendNotificationEmail(
        email,
        name,
        "COLLAB_INVITE",
        {
          projectId,
          message: message || "Vous avez été invité à rejoindre un projet de collaboration sur MediaPro Social Hub.",
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/collab?invite=${influencer._id}`,
          influencerName: name
        }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue even if email fails
    }

    return res.status(201).json({ 
      success: true, 
      influencer,
      message: "Invitation sent successfully" 
    });

  } catch (err) {
    console.error("Error in invite handler:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}

