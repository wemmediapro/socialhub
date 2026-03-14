import { z } from "zod";

export const inviteInfluencerSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
  projectId: z.string().min(1, "projectId requis"),
  message: z.string().optional(),
});

export const mergeInfluencersSchema = z.object({
  influencerIds: z.array(z.string()).min(2, "Au moins 2 IDs requis pour la fusion"),
  targetProjectId: z.string().optional(),
});

export const createInfluencerSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  avatarUrl: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  platforms: z.array(z.object({
    network: z.string(),
    handle: z.string().optional(),
    url: z.string().optional(),
    followers: z.number().optional(),
    avgViews: z.number().optional(),
    avgEngagementRate: z.number().optional(),
  })).optional(),
  niches: z.array(z.string()).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  languages: z.array(z.string()).optional(),
  notes: z.string().optional(),
  notesIt: z.string().optional(),
  status: z.enum(["pending", "active", "inactive"]).optional(),
}).passthrough();

export type InviteInfluencerInput = z.infer<typeof inviteInfluencerSchema>;
export type MergeInfluencersInput = z.infer<typeof mergeInfluencersSchema>;
export type CreateInfluencerInput = z.infer<typeof createInfluencerSchema>;
