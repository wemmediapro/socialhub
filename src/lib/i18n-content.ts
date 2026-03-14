/**
 * Helpers pour afficher le contenu utilisateur (descriptions, notes) selon la langue FR/IT.
 * Utilisé sur toutes les pages : Dashboard, Collaborations, Workflow Collab, Calendar Collab, Influenceurs.
 */

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

export type AppLanguage = "fr" | "it";

export type CollabWithDescription = {
  _id: string;
  description?: string;
  descriptionIt?: string;
};

export type InfluencerWithNotes = {
  _id: string;
  notes?: string;
  notesIt?: string;
  description?: string;
  descriptionIt?: string;
};

export type PostWithCaption = {
  _id: string;
  caption?: string;
  captionIt?: string;
  description?: string;
  descriptionIt?: string;
};

export type IdeaWithTranslation = {
  _id: string;
  title?: string;
  titleIt?: string;
  description?: string;
  descriptionIt?: string;
};

/**
 * Retourne le titre à afficher pour une idée selon la langue.
 */
export function getDisplayTitleIdea(
  idea: IdeaWithTranslation | null | undefined,
  language: AppLanguage
): string {
  if (!idea) return "";
  if (language === "it" && idea.titleIt) return idea.titleIt;
  return idea.title || "";
}

/**
 * Retourne la description à afficher pour une idée selon la langue.
 */
export function getDisplayDescriptionIdea(
  idea: IdeaWithTranslation | null | undefined,
  language: AppLanguage
): string {
  if (!idea) return "";
  if (language === "it" && idea.descriptionIt) return idea.descriptionIt;
  return idea.description || "";
}

/**
 * Retourne la caption à afficher pour un post selon la langue.
 */
export function getDisplayCaptionPost(
  post: PostWithCaption | null | undefined,
  language: AppLanguage
): string {
  if (!post) return "";
  if (language === "it" && post.captionIt) return post.captionIt;
  return post.caption || "";
}

/**
 * Retourne la description interne à afficher pour un post selon la langue.
 */
export function getDisplayDescriptionPost(
  post: PostWithCaption | null | undefined,
  language: AppLanguage
): string {
  if (!post) return "";
  if (language === "it" && post.descriptionIt) return post.descriptionIt;
  return post.description || "";
}

/**
 * Retourne la description à afficher pour une collaboration selon la langue.
 */
export function getDisplayDescriptionCollab(
  collab: CollabWithDescription | null | undefined,
  language: AppLanguage
): string {
  if (!collab) return "";
  if (language === "it" && collab.descriptionIt) return collab.descriptionIt;
  return collab.description || "";
}

/**
 * Retourne la description/notes à afficher pour un influenceur selon la langue.
 * Gère à la fois le champ notes/notesIt (API) et description/descriptionIt (formulaire).
 */
export function getDisplayNotesInfluencer(
  inf: InfluencerWithNotes | null | undefined,
  language: AppLanguage
): string {
  if (!inf) return "";
  if (language === "it") {
    const it = (inf as any).notesIt ?? (inf as any).descriptionIt;
    if (it) return it;
  }
  return (inf as any).notes ?? (inf as any).description ?? "";
}

/**
 * Déclenche la traduction FR → IT des descriptions de collaborations quand la langue est l'italien.
 * À utiliser sur toute page qui affiche une liste de collaborations.
 */
export function useTranslateCollabDescriptionsWhenIt<T extends CollabWithDescription>(
  language: AppLanguage,
  collaborations: T[],
  setCollaborations: Dispatch<SetStateAction<T[]>>
): void {
  const translatedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (language !== "it" || !collaborations.length) return;
    const toTranslate = collaborations.filter(
      (c) =>
        c.description &&
        !c.descriptionIt &&
        !translatedIdsRef.current.has(c._id)
    );
    toTranslate.forEach((collab) => {
      translatedIdsRef.current.add(collab._id);
      fetch(`/api/collaborations/${collab._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translateDescriptionToIt: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.collaboration?.descriptionIt) {
            setCollaborations((prev) =>
              prev.map((c) =>
                c._id === collab._id
                  ? { ...c, descriptionIt: data.collaboration.descriptionIt }
                  : c
              )
            );
          }
        })
        .catch(() => {
          translatedIdsRef.current.delete(collab._id);
        });
    });
  }, [language, collaborations, setCollaborations]);
}

/**
 * Déclenche la traduction FR → IT des captions/descriptions de posts quand la langue est l'italien.
 */
export function useTranslatePostDescriptionsWhenIt<T extends PostWithCaption>(
  language: AppLanguage,
  posts: T[],
  setPosts: Dispatch<SetStateAction<T[]>>
): void {
  const translatedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (language !== "it" || !posts.length) return;
    const toTranslate = posts.filter(
      (p) =>
        ((p.caption && !p.captionIt) || (p.description && !p.descriptionIt)) &&
        !translatedIdsRef.current.has(p._id)
    );
    toTranslate.forEach((post) => {
      translatedIdsRef.current.add(post._id);
      fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translateToIt: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.post && (data.post.captionIt || data.post.descriptionIt)) {
            setPosts((prev) =>
              prev.map((p) =>
                p._id === post._id
                  ? { ...p, captionIt: data.post.captionIt ?? p.captionIt, descriptionIt: data.post.descriptionIt ?? p.descriptionIt }
                  : p
              )
            );
          }
        })
        .catch(() => {
          translatedIdsRef.current.delete(post._id);
        });
    });
  }, [language, posts, setPosts]);
}

/**
 * Déclenche la traduction FR → IT des notes des influenceurs quand la langue est l'italien.
 */
export function useTranslateInfluencerNotesWhenIt(
  language: AppLanguage,
  influencers: InfluencerWithNotes[],
  setInfluencers: (updater: (prev: InfluencerWithNotes[]) => InfluencerWithNotes[]) => void
): void {
  const translatedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (language !== "it" || !influencers.length) return;
    const toTranslate = influencers.filter(
      (inf) =>
        ((inf as any).notes || (inf as any).description) &&
        !(inf as any).notesIt &&
        !(inf as any).descriptionIt &&
        !translatedIdsRef.current.has(inf._id)
    );
    toTranslate.forEach((inf) => {
      translatedIdsRef.current.add(inf._id);
      fetch(`/api/influencers/${inf._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translateNotesToIt: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.influencer?.notesIt) {
            setInfluencers((prev) =>
              prev.map((i) =>
                i._id === inf._id ? { ...i, notesIt: data.influencer.notesIt } : i
              )
            );
          }
        })
        .catch(() => {
          translatedIdsRef.current.delete(inf._id);
        });
    });
  }, [language, influencers, setInfluencers]);
}

/**
 * Déclenche la traduction FR → IT des titres/descriptions des idées quand la langue est l'italien.
 */
export function useTranslateIdeasWhenIt(
  language: AppLanguage,
  ideas: IdeaWithTranslation[],
  setIdeas: (updater: (prev: IdeaWithTranslation[]) => IdeaWithTranslation[]) => void
): void {
  const translatedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (language !== "it" || !ideas.length) return;
    const toTranslate = ideas.filter(
      (idea) =>
        ((idea.title && !idea.titleIt) || (idea.description && !idea.descriptionIt)) &&
        !translatedIdsRef.current.has(idea._id)
    );
    toTranslate.forEach((idea) => {
      translatedIdsRef.current.add(idea._id);
      fetch(`/api/ideas/${idea._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translateToIt: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.idea && (data.idea.titleIt || data.idea.descriptionIt)) {
            setIdeas((prev) =>
              prev.map((i) =>
                i._id === idea._id
                  ? { ...i, titleIt: data.idea.titleIt ?? i.titleIt, descriptionIt: data.idea.descriptionIt ?? i.descriptionIt }
                  : i
              )
            );
          }
        })
        .catch(() => {
          translatedIdsRef.current.delete(idea._id);
        });
    });
  }, [language, ideas, setIdeas]);
}
