import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Influencer from "@/models/Influencer";
import { mergeInfluencersSchema } from "@/lib/schemas/influencers";

/**
 * Merge duplicate influencers into one
 * This endpoint merges influencers with the same name/email into a single influencer
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const parsed = mergeInfluencersSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ error: msg });
    }
    const { influencerIds, targetProjectId } = parsed.data;

    // Get all influencers to merge
    const influencersToMerge = await Influencer.find({
      _id: { $in: influencerIds }
    });

    if (influencersToMerge.length < 2) {
      return res.status(400).json({ 
        error: "Impossible de trouver les influenceurs à fusionner" 
      });
    }

    // Use the first influencer as the base (or the one with most data)
    const baseInfluencer = influencersToMerge.reduce((prev, current) => {
      const prevData = (prev.platforms?.length || 0) + (prev.email ? 1 : 0) + (prev.phone ? 1 : 0);
      const currentData = (current.platforms?.length || 0) + (current.email ? 1 : 0) + (current.phone ? 1 : 0);
      return currentData > prevData ? current : prev;
    });

    // Merge all data
    const mergedData: any = {
      ...baseInfluencer.toObject(),
      projectId: targetProjectId || baseInfluencer.projectId,
      // Merge platforms (avoid duplicates)
      platforms: [],
      // Merge niches
      niches: [],
      // Merge languages
      languages: [],
      // Merge portfolio URLs
      portfolioUrls: []
    };

    // Collect unique platforms
    const platformMap = new Map();
    influencersToMerge.forEach(inf => {
      if (inf.platforms) {
        inf.platforms.forEach((platform: any) => {
          const key = `${platform.network}-${platform.handle || platform.url}`;
          if (!platformMap.has(key)) {
            platformMap.set(key, platform);
          }
        });
      }
    });
    mergedData.platforms = Array.from(platformMap.values());

    // Collect unique niches
    const nicheSet = new Set();
    influencersToMerge.forEach(inf => {
      if (inf.niches) {
        inf.niches.forEach((niche: string) => nicheSet.add(niche));
      }
    });
    mergedData.niches = Array.from(nicheSet);

    // Collect unique languages
    const langSet = new Set();
    influencersToMerge.forEach(inf => {
      if (inf.languages) {
        inf.languages.forEach((lang: string) => langSet.add(lang));
      }
    });
    mergedData.languages = Array.from(langSet);

    // Collect unique portfolio URLs
    const portfolioSet = new Set();
    influencersToMerge.forEach(inf => {
      if (inf.portfolioUrls) {
        inf.portfolioUrls.forEach((url: string) => portfolioSet.add(url));
      }
    });
    mergedData.portfolioUrls = Array.from(portfolioSet);

    // Use the most complete contact info
    influencersToMerge.forEach(inf => {
      if (inf.email && !mergedData.email) mergedData.email = inf.email;
      if (inf.phone && !mergedData.phone) mergedData.phone = inf.phone;
      if (inf.country && !mergedData.country) mergedData.country = inf.country;
      if (inf.city && !mergedData.city) mergedData.city = inf.city;
      if (inf.notes && !mergedData.notes) mergedData.notes = inf.notes;
      if (inf.avatarUrl && !mergedData.avatarUrl) mergedData.avatarUrl = inf.avatarUrl;
    });

    // Update the base influencer with merged data
    await Influencer.findByIdAndUpdate(baseInfluencer._id, mergedData);

    // Delete the other influencers
    const idsToDelete = influencerIds.filter(id => id.toString() !== baseInfluencer._id.toString());
    await Influencer.deleteMany({ _id: { $in: idsToDelete } });

    // Get the merged influencer
    const mergedInfluencer = await Influencer.findById(baseInfluencer._id);

    return res.status(200).json({
      success: true,
      message: `${influencersToMerge.length} influenceur(s) fusionné(s) avec succès`,
      influencer: mergedInfluencer,
      deletedCount: idsToDelete.length
    });

  } catch (err) {
    console.error("Error merging influencers:", err);
    const message = err instanceof Error ? err.message : "Erreur lors de la fusion des influenceurs";
    return res.status(500).json({ 
      error: "Erreur lors de la fusion des influenceurs",
      details: message 
    });
  }
}


