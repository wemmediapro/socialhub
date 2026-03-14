import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Permission, {
  DEFAULT_PERMISSION_MATRIX,
  PermissionMatrix,
  RoleId,
  PermissionKey,
  PagePermissions,
  normalizePagePermissions
} from "@/models/Permission";

const ROLES: RoleId[] = [
  "admin",
  "digital_creative",
  "client",
  "infographiste",
  "video_motion",
  "influencer"
];
const KEYS: PermissionKey[] = [
  "dashboard",
  "stats",
  "projects",
  "ideas",
  "workflowPosts",
  "calendarPosts",
  "influencers",
  "influencerContact",
  "workflowCollab",
  "calendarCollab",
  "library",
  "budgetAndTarifs",
  "settings"
];

function isPagePermissions(v: unknown): v is PagePermissions {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.view === "boolean" &&
    typeof o.create === "boolean" &&
    typeof o.update === "boolean" &&
    typeof o.delete === "boolean" &&
    typeof o.workflow === "boolean"
  );
}

function validateMatrix(body: unknown): body is PermissionMatrix {
  if (!body || typeof body !== "object") return false;
  for (const role of ROLES) {
    if (!(role in body) || typeof (body as Record<string, unknown>)[role] !== "object") return false;
    const perms = (body as Record<string, unknown>)[role] as Record<string, unknown>;
    for (const key of KEYS) {
      const val = perms[key];
      if (val === undefined || val === null) return false;
      if (typeof val === "boolean") continue;
      if (!isPagePermissions(val)) return false;
    }
  }
  return true;
}

/** Normalise la matrice (legacy boolean → PagePermissions) pour réponse GET et avant sauvegarde */
function normalizeMatrix(raw: PermissionMatrix): PermissionMatrix {
  const out: PermissionMatrix = {} as PermissionMatrix;
  for (const role of ROLES) {
    out[role] = {} as Record<PermissionKey, PagePermissions>;
    const fallbackRole = DEFAULT_PERMISSION_MATRIX[role];
    for (const key of KEYS) {
      const current = (raw[role] as Record<string, unknown>)?.[key];
      out[role][key] = normalizePagePermissions(
        current as PagePermissions | boolean | undefined,
        fallbackRole[key]
      );
    }
  }
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
  } catch (e) {
    return res.status(500).json({ error: "Erreur de connexion à la base de données" });
  }

  if (req.method === "GET") {
    try {
      const doc = await Permission.findOne({ id: "default" }).lean();
      let matrix: PermissionMatrix = doc?.matrix
        ? (doc.matrix as PermissionMatrix)
        : DEFAULT_PERMISSION_MATRIX;
      matrix = normalizeMatrix(matrix);
      return res.status(200).json({ matrix });
    } catch (error) {
      console.error("GET /api/permissions:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération des permissions" });
    }
  }

  if (req.method === "PUT") {
    if (!validateMatrix(req.body?.matrix)) {
      return res.status(400).json({ error: "Format de matrice de permissions invalide" });
    }
    try {
      const matrix = normalizeMatrix(req.body.matrix as PermissionMatrix);
      await Permission.findOneAndUpdate(
        { id: "default" },
        { $set: { matrix }, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return res.status(200).json({ matrix, message: "Permissions enregistrées" });
    } catch (error) {
      console.error("PUT /api/permissions:", error);
      return res.status(500).json({ error: "Erreur lors de l'enregistrement des permissions" });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
