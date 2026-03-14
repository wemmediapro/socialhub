import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Influencer from "@/models/Influencer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { id } = req.query as { id: string };
  if (req.method === "PATCH") {
    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return res.status(404).json({ error: "Influencer not found" });
    }

    // Traduction FR → IT des notes si demandée
    if (req.body.translateNotesToIt === true && influencer.notes && !influencer.notesIt) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: `Traduis le texte suivant du français vers l'italien. Conserve le ton. Réponds UNIQUEMENT par la traduction, sans guillemets.\n\n${influencer.notes}`,
            }],
            temperature: 0.2,
          });
          const translated = completion.choices[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, "") || "";
          if (translated) {
            influencer.notesIt = translated;
            influencer.markModified("notesIt");
            await influencer.save();
          }
        } catch (translateErr: any) {
          console.error("Translate influencer notes to IT error:", translateErr);
          return res.status(500).json({
            error: "Erreur lors de la traduction",
            details: process.env.NODE_ENV === "development" ? translateErr.message : undefined,
          });
        }
      }
    }

    const { translateNotesToIt, ...updateBody } = req.body;
    if (Object.keys(updateBody).length > 0) {
      await Influencer.findByIdAndUpdate(id, updateBody);
    }
    const updated = await Influencer.findById(id).lean();
    return res.status(200).json({ influencer: updated });
  }
  if (req.method === "DELETE") {
    await Influencer.findByIdAndDelete(id);
    return res.status(204).end();
  }
  res.setHeader("Allow","PATCH,DELETE");
  res.status(405).end();
}
