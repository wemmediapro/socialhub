import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { getLocalUploadDir } from "@/lib/uploadPath";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/** Normalise le chemin pour limiter les soucis Unicode (NFC) et sécuriser. */
function normalizeFilePath(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return decoded.normalize("NFC");
}

/** Si le fichier n'existe pas exactement, tente de le trouver par préfixe (timestamp) + extension. */
function findFileByPrefix(uploadsDir: string, requestedPath: string): string | null {
  const base = path.basename(requestedPath);
  const ext = path.extname(base).toLowerCase();
  const prefix = base.replace(ext, "");
  const timestampMatch = prefix.match(/^(\d+)-/);
  if (!timestampMatch) return null;
  const timestampPrefix = timestampMatch[1];
  let found: string | null = null;
  try {
    const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!e.name.toLowerCase().endsWith(ext)) continue;
      if (e.name.startsWith(timestampPrefix + "-") || e.name.startsWith(timestampPrefix + "--")) {
        if (found) return null;
        found = path.join(uploadsDir, e.name);
      }
    }
  } catch {
    return null;
  }
  return found;
}

/** Nom de fichier sûr pour l'en-tête Content-Disposition (évite erreurs avec Unicode/emoji). */
function safeContentDispositionFilename(filePath: string): string {
  const name = path.basename(filePath);
  const ext = path.extname(name);
  const safe = name.slice(0, name.length - ext.length).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180) + ext;
  return safe || "file";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { path: filePathArray } = req.query;
  const widthParam = typeof req.query.w === "string" ? req.query.w : null;

  let filePath: string;
  if (Array.isArray(filePathArray)) {
    filePath = filePathArray.map((p) => (typeof p === "string" ? p : "")).join("/");
  } else if (typeof filePathArray === "string") {
    filePath = filePathArray;
  } else {
    return res.status(400).json({ error: "Invalid file path" });
  }

  filePath = normalizeFilePath(filePath);

  if (filePath.includes("..") || (filePath.includes("/") && filePath.startsWith("/"))) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  try {
    const uploadsDir = getLocalUploadDir();
    let fullPath = path.join(uploadsDir, filePath);
    let resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (!fs.existsSync(resolvedPath)) {
      const altPath = findFileByPrefix(uploadsDir, filePath);
      if (altPath) {
        resolvedPath = path.resolve(altPath);
        if (!resolvedPath.startsWith(resolvedUploadsDir)) {
          return res.status(400).json({ error: "Invalid file path" });
        }
      } else {
        return res.status(404).json({ error: "File not found", path: filePath });
      }
    }

    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: "Path is not a file" });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    const fileSize = stats.size;

    // Redimensionnement image pour aperçu / calendrier / workflow (paramètre ?w=)
    const wantThumb = widthParam && IMAGE_EXTS.includes(ext);
    const thumbWidth = wantThumb ? Math.min(800, Math.max(120, parseInt(widthParam, 10) || 400)) : 0;

    if (wantThumb && thumbWidth > 0) {
      try {
        const sharp = (await import("sharp")).default;
        const buffer = fs.readFileSync(resolvedPath);
        const out = await sharp(buffer)
          .resize(thumbWidth, null, { withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Content-Length", out.length);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Content-Disposition", `inline; filename="${safeContentDispositionFilename(resolvedPath)}"`);
        return res.send(out);
      } catch (sharpErr: any) {
        console.warn("Sharp resize failed, serving original:", sharpErr?.message);
        // Fallback: serve original below
      }
    }

    // Support des requêtes Range pour la lecture vidéo/audio
    const rangeHeader = req.headers.range;
    if (rangeHeader && (mimeType.startsWith('video/') || mimeType.startsWith('audio/'))) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        try {
          const stream = fs.createReadStream(resolvedPath, { start, end });
          res.status(206);
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Length', chunkSize);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Content-Disposition', `inline; filename="${safeContentDispositionFilename(resolvedPath)}"`);
          stream.pipe(res);
          return;
        } catch (streamErr: any) {
          console.warn('createReadStream failed, serving full file:', streamErr?.message);
        }
      }
    }

    // Envoi complet (ou fallback si Range a échoué)
    const fileBuffer = fs.readFileSync(resolvedPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', `inline; filename="${safeContentDispositionFilename(resolvedPath)}"`);
    res.send(fileBuffer);
  } catch (error: any) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
