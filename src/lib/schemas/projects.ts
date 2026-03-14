import { z } from "zod";

const socialAccountSchema = z.object({
  network: z.enum(["facebook", "instagram", "tiktok", "twitter", "linkedin", "threads"]),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  pageId: z.string().optional(),
  pageName: z.string().optional(),
  accessToken: z.string().optional(),
  isActive: z.boolean().optional(),
  connectedAt: z.coerce.date().optional(),
});

const teamMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  addedAt: z.coerce.date().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nom du projet requis"),
  description: z.string().optional(),
  client: z.string().optional(),
  logo: z.string().optional(),
  color: z.string().optional(),
  socialAccounts: z.array(socialAccountSchema).optional(),
  team: z.array(teamMemberSchema).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
  createdBy: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
