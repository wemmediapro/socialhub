import { z } from "zod";

const roleEnum = z.enum([
  "admin",
  "digital_creative",
  "client",
  "infographiste",
  "video_motion",
  "influencer",
]);

export const createUserSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  role: roleEnum,
  login: z.string().min(1, "Login requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: roleEnum.optional(),
  login: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
    })
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
