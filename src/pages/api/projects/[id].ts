import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Project from "@/models/Project";
import { updateProjectSchema } from "@/lib/schemas/projects";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: "Projet non trouvé" });
      return res.status(200).json({ project });
    } catch (error) {
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "PUT") {
    try {
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({ error: msg });
      }
      const project = await Project.findByIdAndUpdate(id, { ...parsed.data, updatedAt: new Date() }, { new: true });
      if (!project) return res.status(404).json({ error: "Projet non trouvé" });
      return res.status(200).json({ project });
    } catch (error) {
      return res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const project = await Project.findByIdAndDelete(id);
      if (!project) return res.status(404).json({ error: "Projet non trouvé" });
      return res.status(200).json({ message: "Projet supprimé" });
    } catch (error) {
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}


