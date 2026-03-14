import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Project from "@/models/Project";
import { createProjectSchema } from "@/lib/schemas/projects";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const projects = await Project.find().sort({ createdAt: -1 });
      return res.status(200).json({ projects });
    } catch (error) {
      return res.status(500).json({ error: "Erreur lors de la récupération des projets" });
    }
  }

  if (req.method === "POST") {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({ error: msg });
      }
      const project = await Project.create(parsed.data);
      return res.status(201).json({ project });
    } catch (error) {
      return res.status(400).json({ error: "Erreur lors de la création du projet" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}


