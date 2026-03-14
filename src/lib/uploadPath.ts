import path from "path";

/**
 * Dossier racine des uploads locaux.
 * - Si LOCAL_UPLOAD_DIR est défini dans .env, on l'utilise (relatif à process.cwd() ou absolu).
 * - Sinon : public/uploads (comportement par défaut).
 */
export function getLocalUploadDir(): string {
  const envDir = process.env.LOCAL_UPLOAD_DIR;
  if (envDir && envDir.trim() !== "") {
    const trimmed = envDir.trim();
    return path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
  }
  return path.join(process.cwd(), "public", "uploads");
}
