import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { getLocalUploadDir } from "@/lib/uploadPath";

export const config = {
  api: {
    bodyParser: false,
    // Timeout élevé pour les grosses vidéos sur VPS (5 min).
    // Si vous utilisez Nginx en reverse proxy, ajoutez dans votre config serveur :
    //   client_max_body_size 200M;
    //   proxy_read_timeout 300s;
    //   proxy_connect_timeout 300s;
    //   proxy_send_timeout 300s;
    maxDuration: 300,
  },
};

/** Nom de fichier sûr (ASCII) pour l'URL et le disque, évite 500 avec arabe/emoji. */
function safeFileName(original: string): string {
  const ext = path.extname(original) || ".bin";
  const base = (original.slice(0, original.length - ext.length) || "file").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
  return (base || "file") + ext;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uploadDir = getLocalUploadDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const parsedLimit = parseInt(process.env.LOCAL_UPLOAD_MAX_MB || "", 10);
    const maxFileSizeMB = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 200;
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: maxFileSizeMB * 1024 * 1024, // Default 200MB
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const safeName = safeFileName(file.originalFilename || "file");
    const fileName = `${Date.now()}-${safeName}`;
    const newPath = path.join(uploadDir, fileName);
    
    // Renommer le fichier
    fs.renameSync(file.filepath, newPath);
    
    // Retourner l'URL publique via l'API route (fonctionne en production)
    const publicUrl = `/api/uploads/${fileName}`;
    
    res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
}
