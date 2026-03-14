import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Post from "@/models/Post";
import Project from "@/models/Project";
import { z } from "zod";

const Create = z.object({
  projectId: z.string(),
  projectIds: z.array(z.string()).optional(), // Support multiple projects
  network: z.enum(["facebook","instagram","tiktok","threads"]).optional(), // Optional for backward compatibility
  networks: z.array(z.enum(["facebook","instagram","tiktok","threads"])).optional(), // New multi-network
  type: z.enum(["post","story","reel","carousel"]),
  nature: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  descriptionIt: z.string().optional(),
  captionIt: z.string().optional(),
  hashtags: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).default([]),
  scheduledAt: z.string()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
  await dbConnect();
  } catch (dbError: any) {
    console.error("Database connection error:", dbError);
    return res.status(500).json({ 
      error: "Database connection failed", 
      details: dbError.message 
    });
  }

  if (req.method === "GET") {
    try {
    const { projectId, clientToken } = req.query;
    const filter: any = projectId ? { projectId } : {};
    if (clientToken && String(clientToken) !== "DEMO") {
      filter.clientToken = clientToken;
    }
    const posts = await Post.find(filter).sort({ scheduledAt: 1 }).lean();
    const projectIds = new Set<string>();
    posts.forEach((p: any) => {
      if (p.projectId) projectIds.add(p.projectId);
      if (p.projectIds && p.projectIds.length) p.projectIds.forEach((id: string) => projectIds.add(id));
    });
    const projectList = projectIds.size ? await Project.find({ _id: { $in: Array.from(projectIds) } }).select('_id name').lean() : [];
    const projectMap = Object.fromEntries(projectList.map((pr: any) => [String(pr._id), { _id: pr._id, name: pr.name }]));
    const enriched = posts.map((p: any) => {
      const ids = (p.projectIds && p.projectIds.length) ? p.projectIds : (p.projectId ? [p.projectId] : []);
      const projects = ids.map((id: string) => projectMap[String(id)]).filter(Boolean);
      return { ...p, project: projects[0] || null, projects };
    });
    return res.status(200).json({ posts: enriched });
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      return res.status(500).json({ error: "Error fetching posts", details: error.message });
    }
  }
  
  if (req.method === "POST") {
    try {
      console.log("Creating post with data:", JSON.stringify(req.body, null, 2));
      
      // Validate input data
      const data = Create.parse(req.body);
      
      // Support both single network and multiple networks
      const networks = data.networks || (data.network ? [data.network] : []);
      
      if (networks.length === 0) {
        return res.status(400).json({ error: "At least one network is required" });
      }

      // Verify projectId exists if provided
      if (data.projectId === "DEMO") {
        console.warn("Warning: Using DEMO projectId");
      }

      // Support multiple projects: use projectIds if provided, otherwise use projectId
      const projectIds = data.projectIds && data.projectIds.length > 0 
        ? data.projectIds 
        : [data.projectId];
      
      const post = await Post.create({
        ...data,
        projectId: data.projectId, // Keep for backward compatibility
        projectIds: projectIds, // Array of all project IDs
        network: networks[0], // First network for compatibility
        networks: networks, // Array of all networks
        descriptionIt: data.descriptionIt || undefined,
        captionIt: data.captionIt || undefined,
        mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
        scheduledAt: new Date(data.scheduledAt),
        status: "DRAFT", // All new posts start as DRAFT
        clientToken: Math.random().toString(36).slice(2,10),
        history: [{ action: "created", by: "user", note: "Post created as DRAFT" }]
      });
      
      console.log("Post created successfully:", post._id, "mediaUrls count:", (post.mediaUrls || []).length);
      return res.status(201).json({ post });
    } catch (e: any) {
      console.error("Error creating post:", e);
      
      // Handle Zod validation errors
      if (e.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Validation error", 
          details: e.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        });
    }
      
      // Handle MongoDB errors
      if (e.name === 'MongoError' || e.name === 'MongoServerError') {
        return res.status(500).json({ 
          error: "Database error", 
          details: e.message 
        });
      }
      
      // Generic error
      return res.status(500).json({ 
        error: e.message || "Error creating post",
        details: e.stack 
      });
    }
  }
  
  res.setHeader("Allow", "GET,POST");
  res.status(405).end();
}
