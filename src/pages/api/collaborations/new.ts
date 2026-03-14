import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Cette route n'existe plus - retourner une réponse claire
    res.setHeader("Allow", "GET,POST");
    return res.status(200).json({ 
      message: "Cette route n'existe plus. Utilisez POST /api/collaborations pour créer une nouvelle collaboration.",
      deprecated: true
    });
  } catch (error: any) {
    console.error("Error in /api/collaborations/new:", error);
    return res.status(500).json({ 
      error: "Erreur serveur",
      message: error.message 
    });
  }
}

