import mongoose, { Schema, Document, Model } from "mongoose";

export type PermissionKey =
  | "dashboard"
  | "stats"
  | "projects"
  | "ideas"
  | "workflowPosts"
  | "calendarPosts"
  | "influencers"
  | "influencerContact"
  | "workflowCollab"
  | "calendarCollab"
  | "library"
  | "budgetAndTarifs"
  | "settings";

export type RoleId = "admin" | "digital_creative" | "client" | "infographiste" | "video_motion" | "influencer";

/** Permissions granulaires par page : consulter, ajouter, modifier, supprimer, workflow */
export type PagePermissions = {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  workflow: boolean;
};

export type RolePermission = Record<PermissionKey, PagePermissions>;
export type PermissionMatrix = Record<RoleId, RolePermission>;

interface IPermissionDoc extends Document {
  id: string;
  matrix: PermissionMatrix;
  updatedAt: Date;
}

const PermissionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, default: "default" },
    matrix: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

const Permission: Model<IPermissionDoc> =
  mongoose.models?.Permission || mongoose.model<IPermissionDoc>("Permission", PermissionSchema);

export default Permission;

/** Crée un PagePermissions à partir d'un booléen (rétrocompat) : tout à la même valeur */
export function toPagePermissions(value: boolean): PagePermissions {
  return {
    view: value,
    create: value,
    update: value,
    delete: value,
    workflow: value
  };
}

/** Normalise une entrée rôle/page : accepte ancien format (boolean) ou nouveau (PagePermissions) */
export function normalizePagePermissions(
  current: PagePermissions | boolean | undefined,
  fallback: PagePermissions
): PagePermissions {
  if (current === undefined || current === null) return fallback;
  if (typeof current === "boolean") return toPagePermissions(current);
  return {
    view: typeof current.view === "boolean" ? current.view : fallback.view,
    create: typeof current.create === "boolean" ? current.create : fallback.create,
    update: typeof current.update === "boolean" ? current.update : fallback.update,
    delete: typeof current.delete === "boolean" ? current.delete : fallback.delete,
    workflow: typeof current.workflow === "boolean" ? current.workflow : fallback.workflow
  };
}

/** Pages qui ont les 5 actions (workflow notamment) ; les autres n'utilisent que view en pratique */
export const PAGES_WITH_FULL_CRUD: PermissionKey[] = [
  "dashboard",
  "stats",
  "projects",
  "ideas",
  "workflowPosts",
  "calendarPosts",
  "influencers",
  "workflowCollab",
  "calendarCollab",
  "library"
];

/** Valeurs par défaut des permissions (format granulaire) */
function buildDefaultPagePerms(view: boolean, full = view): PagePermissions {
  return {
    view,
    create: full,
    update: full,
    delete: full,
    workflow: full
  };
}

/** Accès simple (ex: paramètres, budget) : seul view est pertinent */
function accessOnly(value: boolean): PagePermissions {
  return { view: value, create: false, update: false, delete: false, workflow: false };
}

export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  admin: {
    dashboard: buildDefaultPagePerms(true),
    stats: buildDefaultPagePerms(true),
    projects: buildDefaultPagePerms(true),
    ideas: buildDefaultPagePerms(true),
    workflowPosts: buildDefaultPagePerms(true),
    calendarPosts: buildDefaultPagePerms(true),
    influencers: buildDefaultPagePerms(true),
    influencerContact: accessOnly(true),
    workflowCollab: buildDefaultPagePerms(true),
    calendarCollab: buildDefaultPagePerms(true),
    library: buildDefaultPagePerms(true),
    budgetAndTarifs: accessOnly(true),
    settings: accessOnly(true)
  },
  digital_creative: {
    dashboard: buildDefaultPagePerms(true),
    stats: buildDefaultPagePerms(true),
    projects: buildDefaultPagePerms(true),
    ideas: buildDefaultPagePerms(true),
    workflowPosts: buildDefaultPagePerms(true),
    calendarPosts: buildDefaultPagePerms(true),
    influencers: buildDefaultPagePerms(true),
    influencerContact: accessOnly(true),
    workflowCollab: buildDefaultPagePerms(true),
    calendarCollab: buildDefaultPagePerms(true),
    library: buildDefaultPagePerms(true),
    budgetAndTarifs: accessOnly(false),
    settings: accessOnly(false)
  },
  client: {
    dashboard: buildDefaultPagePerms(true),
    stats: buildDefaultPagePerms(true),
    projects: buildDefaultPagePerms(true),
    ideas: buildDefaultPagePerms(true),
    workflowPosts: buildDefaultPagePerms(true),
    calendarPosts: buildDefaultPagePerms(true),
    influencers: buildDefaultPagePerms(true),
    influencerContact: accessOnly(true),
    workflowCollab: buildDefaultPagePerms(true),
    calendarCollab: buildDefaultPagePerms(true),
    library: buildDefaultPagePerms(true),
    budgetAndTarifs: accessOnly(true),
    settings: accessOnly(false)
  },
  infographiste: {
    dashboard: buildDefaultPagePerms(true),
    stats: buildDefaultPagePerms(true),
    projects: buildDefaultPagePerms(true),
    ideas: buildDefaultPagePerms(true),
    workflowPosts: buildDefaultPagePerms(true),
    calendarPosts: buildDefaultPagePerms(true),
    influencers: accessOnly(false),
    influencerContact: accessOnly(false),
    workflowCollab: accessOnly(false),
    calendarCollab: accessOnly(false),
    library: buildDefaultPagePerms(true),
    budgetAndTarifs: accessOnly(false),
    settings: accessOnly(false)
  },
  video_motion: {
    dashboard: buildDefaultPagePerms(true),
    stats: buildDefaultPagePerms(true),
    projects: buildDefaultPagePerms(true),
    ideas: buildDefaultPagePerms(true),
    workflowPosts: buildDefaultPagePerms(true),
    calendarPosts: buildDefaultPagePerms(true),
    influencers: accessOnly(false),
    influencerContact: accessOnly(false),
    workflowCollab: accessOnly(false),
    calendarCollab: accessOnly(false),
    library: buildDefaultPagePerms(true),
    budgetAndTarifs: accessOnly(false),
    settings: accessOnly(false)
  },
  influencer: {
    dashboard: accessOnly(false),
    stats: accessOnly(false),
    projects: accessOnly(false),
    ideas: accessOnly(false),
    workflowPosts: accessOnly(false),
    calendarPosts: accessOnly(false),
    influencers: accessOnly(false),
    influencerContact: accessOnly(false),
    workflowCollab: buildDefaultPagePerms(true),
    calendarCollab: buildDefaultPagePerms(true),
    library: accessOnly(false),
    budgetAndTarifs: accessOnly(false),
    settings: accessOnly(false)
  }
};
