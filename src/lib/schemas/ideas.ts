import { z } from "zod";

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().min(1, "Description requise"),
  titleIt: z.string().optional(),
  descriptionIt: z.string().optional(),
  type: z.enum(["post", "photo_shoot", "video_shoot", "collaboration"]),
  projectIds: z.array(z.string()).default([]),
  status: z
    .enum(["pending", "in_discussion", "validated", "rejected", "archived"])
    .optional(),
  createdBy: z
    .object({
      userId: z.string(),
      name: z.string(),
      role: z.string(),
    })
    .optional(),
  mediaUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  estimatedBudget: z.number().optional(),
  estimatedDuration: z.string().optional(),
  targetDate: z.string().optional(),
});

export const updateIdeaSchema = createIdeaSchema.partial();

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
