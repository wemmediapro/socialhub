import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const timestamp = Math.floor(Date.now() / 1000);
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const paramsToSign = `timestamp=${timestamp}` + (preset ? `&upload_preset=${preset}` : "");
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");
  res.status(200).json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    uploadPreset: preset || null
  });
}
