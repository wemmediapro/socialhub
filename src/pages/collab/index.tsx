import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getMediaUrlForContext } from "@/lib/utils";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import { getDisplayDescriptionCollab, useTranslateCollabDescriptionsWhenIt } from "@/lib/i18n-content";
import Breadcrumbs from "@/components/Breadcrumbs";
import { 
  Filter,
  Clock,
  Palette,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  User,
  Users,
  Hash,
  FileText,
  Calendar,
  Image as ImageIcon,
  Video,
  Briefcase,
  Instagram,
  Facebook,
  Music,
  Trash2,
  Check,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Plus,
  BarChart3,
  ExternalLink,
  Maximize2
} from "lucide-react";

type WorkflowCollaboration = {
  _id: string;
  projectId: string;
  projectIds?: string[];
  influencerId: string;
  description: string;
  descriptionIt?: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  createdBy?: string;
  assignedTo?: string;
  comments?: any[];
  mediaUrls?: string[];
  hashtags?: string;
  contentUploads?: Array<{
    _id?: string;
    uploadedBy: string;
    role: "INFLUENCER" | "CREATIVE" | "DIGITAL_MARKETER";
    urls: string[];
    description: string;
    uploadedAt: string;
    validatedByClient: boolean;
    scheduledAt?: string;
    publishedAt?: string;
    platform?: "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "snapchat" | "linkedin" | "threads";
    sentiment?: "positive" | "neutral" | "negative";
    postUrl?: string;
    insights?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      engagement_rate?: number;
    };
    platformStats?: Array<{
      platform: string;
      sentiment?: "positive" | "neutral" | "negative";
      publishedAt?: string;
      postUrl?: string;
      insights?: {
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        saves?: number;
        engagement_rate?: number;
      };
    }>;
  }>;
  history?: Array<{ at: string; action: string; by: string; note: string }>;
  createdAt: string;
  updatedAt: string;
};

export default function CollabWorkflowPage() {
  const router = useRouter();
  const { user, canSeeBudgetAndTarifs, canUpdate, canDelete } = useAuth();
  const { t, language } = useTranslation();
  const getDisplayDescription = (c: WorkflowCollaboration) => getDisplayDescriptionCollab(c, language);
  const [collaborations, setCollaborations] = useState<WorkflowCollaboration[]>([]);
  useTranslateCollabDescriptionsWhenIt(language, collaborations, setCollaborations);
  const [filter, setFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [sortByDate, setSortByDate] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);
  const [expandedCollaborations, setExpandedCollaborations] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  /** Progression d'upload par collab: { percent, currentFile, current, total } */
  const [uploadProgress, setUploadProgress] = useState<Record<string, { percent: number; currentFile?: string; current?: number; total?: number }>>({});
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCollabInCalendar, setSelectedCollabInCalendar] = useState<WorkflowCollaboration | null>(null);
  const metricsLabels = {
    views: t('collab.statsLabels.views'),
    likes: t('collab.statsLabels.likes'),
    comments: t('collab.statsLabels.comments'),
    shares: t('collab.statsLabels.shares'),
    saves: t('collab.statsLabels.saves'),
    engagement_rate: t('collab.statsLabels.engagementRate')
  };
  type MetricKey = keyof typeof metricsLabels;
  const metricKeys: MetricKey[] = ["views", "likes", "comments", "shares", "saves", "engagement_rate"];
  const [statsContext, setStatsContext] = useState<{ collabId: string; uploadIndex: number; mode: "publish" | "edit" } | null>(null);
  const postPlatforms: Array<"facebook" | "instagram" | "tiktok" | "threads" | "youtube"> = ["facebook", "instagram", "tiktok", "threads", "youtube"];
  const emptyStatsForm = {
    platform: "" as "" | "facebook" | "instagram" | "tiktok" | "threads" | "youtube",
    sentiment: "neutral" as "positive" | "neutral" | "negative",
    publishedAt: "",
    postUrl: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    saves: "",
    engagement_rate: ""
  };
  const [statsForm, setStatsForm] = useState<typeof emptyStatsForm>(emptyStatsForm);
  const [savingStats, setSavingStats] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // État pour les statistiques multi-plateformes
  const [multiPlatformStatsContext, setMultiPlatformStatsContext] = useState<{ collabId: string; uploadIndex: number } | null>(null);
  const [multiPlatformStats, setMultiPlatformStats] = useState<Array<{
    platform: string;
    link: string;
    sentiment: "positive" | "neutral" | "negative";
    views: string;
    saved: string;
    likes: string;
    comments: string;
    shares: string;
    rer: string;
    sponsored: boolean;
  }>>([]);
  const [savingMultiStats, setSavingMultiStats] = useState(false);
  
  // États pour le modal de création de collaboration
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  /** Contenu (vidéos/images) en cours d'édition dans le modal – uniquement en mode édition */
  const [editingContentUploads, setEditingContentUploads] = useState<WorkflowCollaboration["contentUploads"]>(null);
  const [newCollab, setNewCollab] = useState({
    influencerId: "",
    projectId: "",
    contentType: "reel" as "reel" | "story",
    platforms: [] as string[],
    description: "",
    descriptionIt: "",
    captionFr: "",
    captionIt: "",
    budget: "",
    startDate: "",
    endDate: "",
    createdBy: user ? `${user.firstName} ${user.lastName}`.trim() : "Digital Marketer"
  });

  const COLLAB_PLATFORMS = ["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"] as const;

  const formatDateTimeLocal = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - tzOffset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const resetStatsForm = () => {
    setStatsForm(emptyStatsForm);
    setStatsContext(null);
  };

  const openStatsEditor = (post: WorkflowCollaboration, mode: "publish" | "edit") => {
    console.log("openStatsEditor appelé pour:", post._id, "mode:", mode);
    
    // Trouver le premier upload qui a des statistiques OU le premier upload disponible
    const uploads = post.contentUploads || [];
    let targetUpload = uploads.find(u => u.insights && Object.keys(u.insights).length > 0);
    let uploadIndex = 0;
    
    if (targetUpload) {
      uploadIndex = uploads.indexOf(targetUpload);
      console.log("Upload avec stats trouvé à l'index:", uploadIndex);
    } else if (uploads.length > 0) {
      targetUpload = uploads[0];
      uploadIndex = 0;
      console.log("Aucun upload avec stats, utilisation du premier upload");
    } else {
      console.warn("Aucun upload disponible pour cette collaboration");
      // Créer un upload par défaut si aucun n'existe
      targetUpload = null;
      uploadIndex = 0;
    }
    
    const defaultPlatform = targetUpload?.platform || "";
    const defaultSentiment = targetUpload?.sentiment || "neutral";
    const defaultPublishedAt =
      mode === "publish"
        ? formatDateTimeLocal(new Date().toISOString())
        : targetUpload?.publishedAt ? formatDateTimeLocal(targetUpload.publishedAt) : "";

    const formData = {
      platform: defaultPlatform as "" | "facebook" | "instagram" | "tiktok" | "threads" | "youtube",
      sentiment: defaultSentiment as "positive" | "neutral" | "negative",
      publishedAt: defaultPublishedAt,
      postUrl: targetUpload?.postUrl || "",
      views: targetUpload?.insights?.views?.toString() || "",
      likes: targetUpload?.insights?.likes?.toString() || "",
      comments: targetUpload?.insights?.comments?.toString() || "",
      shares: targetUpload?.insights?.shares?.toString() || "",
      saves: targetUpload?.insights?.saves?.toString() || "",
      engagement_rate: targetUpload?.insights?.engagement_rate?.toString() || ""
    };
    
    console.log("Formulaire initialisé avec:", formData);
    
    setStatsForm(formData);
    setStatsContext({ collabId: post._id, uploadIndex, mode });
    
    console.log("statsContext configuré:", { collabId: post._id, uploadIndex, mode });
  };

  const handleStatsChange = (field: keyof typeof emptyStatsForm, value: string) => {
    setStatsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCloseStatsEditor = () => {
    resetStatsForm();
  };

  const handleSaveStats = async () => {
    if (!statsContext) return;
    const targetCollab = collaborations.find(c => c._id === statsContext.collabId);
    if (!targetCollab) return;

    setSavingStats(true);
    try {
      const payload: any = {};

      // Mettre à jour le contentUpload spécifique
      const uploadIndex = statsContext.uploadIndex ?? 0;
      const targetUpload = targetCollab.contentUploads?.[uploadIndex];
      
      if (!targetCollab.contentUploads || !targetCollab.contentUploads[uploadIndex]) {
        throw new Error("Content upload not found");
      }

      // Construire le payload pour mettre à jour le contentUpload
      const uploadUpdate: any = {};
      
      const trimmedUrl = (statsForm.postUrl || "").trim();
      if (trimmedUrl) {
        uploadUpdate.postUrl = trimmedUrl;
      }

      if (statsForm.platform) {
        uploadUpdate.platform = statsForm.platform;
      }

      uploadUpdate.sentiment = statsForm.sentiment || "neutral";

      if (statsForm.publishedAt) {
        const dateValue = new Date(statsForm.publishedAt);
        if (!Number.isNaN(dateValue.getTime())) {
          uploadUpdate.publishedAt = dateValue.toISOString();
        }
      } else if (statsContext.mode === "publish") {
        uploadUpdate.publishedAt = new Date().toISOString();
      }

      // Construire les insights depuis le formulaire
      const currentInsights: any = {};
      metricKeys.forEach((key) => {
        const raw = statsForm[key];
        if (raw && raw.trim() !== '') {
          const parsed = Number(raw.trim());
          if (!Number.isNaN(parsed) && parsed >= 0) {
            currentInsights[key] = parsed;
          }
        }
      });

      // Toujours inclure les insights dans uploadUpdate, même si vide (pour les supprimer)
        uploadUpdate.insights = currentInsights;
      
      console.log("Upload update avec insights:", JSON.stringify({
        uploadIndex,
        insights: uploadUpdate.insights,
        insightsKeys: Object.keys(uploadUpdate.insights),
        platform: uploadUpdate.platform,
        publishedAt: uploadUpdate.publishedAt
      }, null, 2));

      // Mettre à jour le contentUpload dans le tableau
      const updatedUploads = [...(targetCollab.contentUploads || [])];
      
      // S'assurer que l'upload existe
      if (!updatedUploads[uploadIndex]) {
        throw new Error(`Content upload at index ${uploadIndex} does not exist`);
      }
      
      // Fusionner correctement tous les champs de l'upload existant avec les mises à jour
      const existingUpload = updatedUploads[uploadIndex];
      
      // Construire le nouvel upload en préservant tous les champs existants
      updatedUploads[uploadIndex] = {
        // Préserver tous les champs existants
        uploadedBy: existingUpload.uploadedBy || "User",
        role: existingUpload.role || "DIGITAL_MARKETER",
        urls: existingUpload.urls || [],
        description: existingUpload.description || "",
        uploadedAt: existingUpload.uploadedAt || new Date().toISOString(),
        validatedByClient: existingUpload.validatedByClient !== undefined ? existingUpload.validatedByClient : false,
        // Ajouter ou mettre à jour les champs optionnels
        scheduledAt: uploadUpdate.scheduledAt || existingUpload.scheduledAt,
        publishedAt: uploadUpdate.publishedAt || existingUpload.publishedAt,
        platform: uploadUpdate.platform || existingUpload.platform,
        sentiment: uploadUpdate.sentiment || existingUpload.sentiment,
        postUrl: uploadUpdate.postUrl || existingUpload.postUrl,
        // CRITIQUE: Les insights doivent être inclus même s'ils sont vides
        insights: uploadUpdate.insights && Object.keys(uploadUpdate.insights).length > 0 
          ? uploadUpdate.insights 
          : (existingUpload.insights || {})
      };
      
      console.log("=== PAYLOAD FINAL ===");
      console.log("Upload mis à jour:", JSON.stringify({
        uploadIndex,
        hasInsights: !!updatedUploads[uploadIndex].insights,
        insights: updatedUploads[uploadIndex].insights,
        insightsKeys: updatedUploads[uploadIndex].insights ? Object.keys(updatedUploads[uploadIndex].insights) : [],
        platform: updatedUploads[uploadIndex].platform,
        publishedAt: updatedUploads[uploadIndex].publishedAt
      }, null, 2));
      
      payload.contentUploads = updatedUploads;
      
      console.log("Payload complet contentUploads:", JSON.stringify(payload.contentUploads.map((u: any, idx: number) => ({
        index: idx,
        hasInsights: !!u.insights,
        insights: u.insights,
        insightsKeys: u.insights ? Object.keys(u.insights) : []
      })), null, 2));

      if (statsContext.mode === "publish") {
        payload.status = "PUBLISHED";
      }

      const userName = user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur";
      const historyEntry = {
        at: new Date().toISOString(),
        action: statsContext.mode === "publish" ? "manual_publish" : "update_stats",
        by: userName || "Utilisateur",
        note: statsContext.mode === "publish"
          ? "Publication marquée comme publiée depuis le workflow"
          : "Statistiques mises à jour depuis le workflow"
      };
      payload.history = [...(targetCollab.history || []), historyEntry];

      console.log("Saving stats payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/collaborations/${targetCollab._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log("API response:", JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save stats");
      }

      // Vérifier que les données sont bien retournées
      if (!data.collaboration) {
        throw new Error("No collaboration data returned from API");
      }

      // Recharger toutes les collaborations depuis l'API pour s'assurer d'avoir les dernières données
      const allCollabsResponse = await fetch("/api/collaborations");
      const allCollabsData = await allCollabsResponse.json();
      
      if (allCollabsData.collaborations) {
        setCollaborations(allCollabsData.collaborations);
      } else {
        // Fallback : mettre à jour seulement la collaboration modifiée
        const updatedCollaborations = collaborations.map(c => {
          if (c._id === targetCollab._id) {
            return data.collaboration || c;
          }
          return c;
        });
        setCollaborations(updatedCollaborations);
      }
      
      // Fermer le modal et réinitialiser le formulaire
      resetStatsForm();
      
      // Afficher le message de succès
      alert(statsContext.mode === "publish" ? t('workflow.statsPublishSuccess') : t('workflow.statsSaveSuccess'));
    } catch (error: any) {
      console.error("Error saving stats:", error);
      alert(t('workflow.statsSaveError') + (error?.message ? `: ${error.message}` : ""));
    } finally {
      setSavingStats(false);
    }
  };

  // Fonctions pour les statistiques multi-plateformes
  const handleAddPlatform = () => {
    setMultiPlatformStats([...multiPlatformStats, {
      platform: "",
      link: "",
      sentiment: "neutral",
      views: "",
      saved: "",
      likes: "",
      comments: "",
      shares: "",
      rer: "",
      sponsored: false
    }]);
  };

  const handleRemovePlatform = (index: number) => {
    setMultiPlatformStats(multiPlatformStats.filter((_, i) => i !== index));
  };

  const handleMultiStatsChange = (index: number, field: string, value: string | boolean) => {
    const updated = [...multiPlatformStats];
    updated[index] = { ...updated[index], [field]: value };
    setMultiPlatformStats(updated);
  };

  const handleSaveMultiStats = async () => {
    if (!multiPlatformStatsContext) return;
    const targetCollab = collaborations.find(c => c._id === multiPlatformStatsContext.collabId);
    if (!targetCollab) return;

    setSavingMultiStats(true);
    try {
      // Valider que toutes les plateformes ont au moins une plateforme sélectionnée
      const validStats = multiPlatformStats.filter(stat => stat.platform);
      if (validStats.length === 0) {
        alert("Veuillez ajouter au moins une plateforme avec des statistiques");
        return;
      }

      // Convertir les statistiques au format platformStats pour contentUploads
      const formattedStats = validStats.map(stat => {
        const insights: any = {};
        if (stat.views) insights.views = Number(stat.views);
        if (stat.saved) insights.saves = Number(stat.saved);
        if (stat.likes) insights.likes = Number(stat.likes);
        if (stat.comments) insights.comments = Number(stat.comments);
        if (stat.shares) insights.shares = Number(stat.shares);
        if (stat.rer) insights.engagement_rate = Number(stat.rer);
        
        return {
        platform: stat.platform,
          postUrl: stat.link || undefined,
        sentiment: stat.sentiment || "neutral",
          publishedAt: new Date().toISOString(), // Date de publication
          insights: Object.keys(insights).length > 0 ? insights : undefined
        };
      });

      // Mettre à jour le contentUpload spécifique avec les platformStats
      const uploadIndex = multiPlatformStatsContext.uploadIndex >= 0 ? multiPlatformStatsContext.uploadIndex : 0;
      const updatedUploads = [...(targetCollab.contentUploads || [])];
      
      // S'assurer que l'upload existe
      if (!updatedUploads[uploadIndex]) {
        throw new Error(`Content upload at index ${uploadIndex} does not exist`);
      }
      
      // Préserver tous les champs existants et ajouter/mettre à jour platformStats
      updatedUploads[uploadIndex] = {
        ...updatedUploads[uploadIndex],
        platformStats: formattedStats
      };

      const payload: any = {
        contentUploads: updatedUploads
      };

      const userName = user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur";
      const historyEntry = {
        at: new Date().toISOString(),
        action: "update_multi_platform_stats",
        by: userName || "Utilisateur",
        note: "Statistiques multi-plateformes mises à jour"
      };
      payload.history = [...(targetCollab.history || []), historyEntry];

      console.log("=== SAVING MULTI-PLATFORM STATS ===");
      console.log("Target collab ID:", targetCollab._id);
      console.log("Upload index:", uploadIndex);
      console.log("Formatted stats:", JSON.stringify(formattedStats, null, 2));
      console.log("Updated uploads:", JSON.stringify(updatedUploads.map((u: any, idx: number) => ({
        index: idx,
        hasPlatformStats: !!u.platformStats,
        platformStatsCount: u.platformStats ? u.platformStats.length : 0,
        platformStats: u.platformStats
      })), null, 2));
      console.log("Full payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/collaborations/${targetCollab._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save multi-platform stats");
      }

      // Recharger toutes les collaborations depuis l'API
      const allCollabsResponse = await fetch("/api/collaborations");
      const allCollabsData = await allCollabsResponse.json();
      
      if (allCollabsData.collaborations) {
        setCollaborations(allCollabsData.collaborations);
      } else {
      setCollaborations(collaborations.map(c => c._id === targetCollab._id ? data.collaboration : c));
      }
      
      alert("Statistiques multi-plateformes enregistrées avec succès !");
      setMultiPlatformStatsContext(null);
      setMultiPlatformStats([]);
    } catch (error: any) {
      console.error("Error saving multi-platform stats:", error);
      alert("Erreur lors de l'enregistrement des statistiques: " + (error.message || ""));
    } finally {
      setSavingMultiStats(false);
    }
  };

  const handleCloseMultiStatsEditor = () => {
    setMultiPlatformStatsContext(null);
    setMultiPlatformStats([]);
  };

  // Fonction pour récupérer automatiquement les statistiques depuis l'URL
  const [fetchingStats, setFetchingStats] = useState<{ [key: number]: boolean }>({});

  const handleFetchStatsFromUrl = async (index: number) => {
    const stat = multiPlatformStats[index];
    if (!stat.link || !stat.platform) {
      alert("Veuillez d'abord sélectionner une plateforme et entrer un lien");
      return;
    }

    setFetchingStats({ ...fetchingStats, [index]: true });

    try {
      // Appel à l'API pour récupérer les statistiques
      const response = await fetch('/api/collaborations/fetch-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: stat.link,
          platform: stat.platform
        })
      });

      const data = await response.json();

      if (response.ok && data.stats) {
        // Mettre à jour les statistiques récupérées
        const updated = [...multiPlatformStats];
        updated[index] = {
          ...updated[index],
          views: data.stats.views?.toString() || updated[index].views,
          saved: data.stats.saves?.toString() || updated[index].saved,
          likes: data.stats.likes?.toString() || updated[index].likes,
          comments: data.stats.comments?.toString() || updated[index].comments,
          shares: data.stats.shares?.toString() || updated[index].shares,
          rer: data.stats.engagement_rate?.toString() || updated[index].rer,
          sponsored: data.stats.sponsored !== undefined ? data.stats.sponsored : updated[index].sponsored
        };
        setMultiPlatformStats(updated);
        alert("Statistiques récupérées avec succès !");
      } else {
        alert(data.error || "Impossible de récupérer les statistiques. Veuillez les saisir manuellement.");
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      alert("Erreur lors de la récupération des statistiques. Veuillez les saisir manuellement.");
    } finally {
      setFetchingStats({ ...fetchingStats, [index]: false });
    }
  };

  // Déterminer le rôle de l'utilisateur connecté
  const isAdmin = user?.role === 'admin';
  const isGraphiste = user?.role === 'infographiste' || user?.role === 'video_motion';
  const isClient = user?.role === 'client';
  const isDigital = user?.role === 'digital_creative' || user?.role === 'admin';
  const isInfluencer = user?.role === 'influencer';
  
  // Pour l'admin : état local pour le filtre de rôle (peut être modifié)
  // Pour les autres : rôle fixe basé sur l'utilisateur connecté
  const [roleFilter, setRoleFilter] = useState<"digital" | "graphiste" | "video_motion" | "client" | "influencer" | "all">("all");
  
  // Déterminer le rôle pour le workflow (format simplifié)
  const userRole: "digital" | "graphiste" | "client" | "influencer" = isGraphiste 
    ? "graphiste" 
    : isClient 
    ? "client" 
    : isInfluencer 
    ? "influencer" 
    : "digital";

  // Mapper le rôle de l'utilisateur vers assignedTo
  const getUserAssignedTo = (): string | null => {
    if (user?.role === 'infographiste') return 'infographiste';
    if (user?.role === 'video_motion') return 'video_motion';
    return null;
  };

  const handleDelete = async (collabId: string) => {
    if (!confirm(t('workflow.deleteConfirm'))) return;
    try {
      await fetch(`/api/collaborations/${collabId}`, { method: 'DELETE' });
      setCollaborations(collaborations.filter(c => c._id !== collabId));
      alert(t('workflow.deleteSuccess'));
    } catch (error) {
      alert(t('workflow.deleteError'));
    }
  };

  const handleValidate = async (collabId: string) => {
    try {
      console.log('=== VALIDATION START ===');
      console.log('Post ID:', collabId);
      console.log('User is admin:', isAdmin);
      console.log('User role:', userRole);
      console.log('User object:', user);
      
      const requestBody = {
        collabId,
        action: 'VALIDATE_DRAFT',
        comment: comments[collabId] || t('workflow.draftValidated'),
        role: isAdmin ? 'ADMIN' : userRole === 'digital' ? 'DIGITAL_MARKETER' : userRole === 'client' ? 'CLIENT' : 'GRAPHIC_DESIGNER'
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/collaborations/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        console.log('Validation successful, updating posts...');
        const updatedPosts = collaborations.map(c => c._id === collabId ? data.collaboration : c);
        console.log('Updated posts:', updatedPosts);
        setCollaborations(updatedPosts);
        setComments({ ...comments, [collabId]: '' });
        alert(t('workflow.validateSuccess'));
        console.log('=== VALIDATION SUCCESS ===');
      } else {
        console.error('Validation failed:', data);
        const errorMsg = data.error || t('workflow.validateError');
        alert(errorMsg);
        console.log('=== VALIDATION FAILED ===');
      }
    } catch (error: any) {
      console.error('=== VALIDATION ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(t('workflow.validateError') + ': ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddComment = async (collabId: string) => {
    if (!comments[collabId]?.trim()) {
      alert(t('workflow.commentRequired'));
      return;
    }
    try {
      const post = collaborations.find(c => c._id === collabId);
      if (!post) return;
      
      // Utiliser le nom réel de l'utilisateur connecté
      const userName = user ? `${user.firstName} ${user.lastName}` : 
        (userRole === 'digital' ? t('workflow.digitalMarketer') : 
         userRole === 'client' ? t('workflow.client') : 
         user?.role === 'video_motion' ? t('workflow.videoMotion') : t('workflow.graphiste'));
      
      // Mapper le rôle de l'utilisateur vers le format attendu
      const getRoleForComment = (): "DIGITAL_MARKETER" | "GRAPHIC_DESIGNER" | "CLIENT" | "ADMIN" => {
        if (isAdmin) return 'ADMIN';
        if (isDigital) return 'DIGITAL_MARKETER';
        if (isClient) return 'CLIENT';
        // Graphiste et Vidéo Motion sont tous deux GRAPHIC_DESIGNER pour les commentaires
        return 'GRAPHIC_DESIGNER';
      };
      
      const updatedComments = [
        ...(post.comments || []),
        {
          user: userName,
          role: getRoleForComment(),
          text: comments[collabId],
          createdAt: new Date().toISOString()
        }
      ];
      await fetch(`/api/collaborations/${collabId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });
      setCollaborations(collaborations.map(c => c._id === collabId ? { ...c, comments: updatedComments } : c));
      setComments({ ...comments, [collabId]: '' });
    } catch (error) {
      alert(t('workflow.commentError'));
    }
  };

  const handleMediaUpload = async (collabId: string, files: FileList) => {
    if (!files || !files.length) return;
    setUploading({ ...uploading, [collabId]: true });
    const total = files.length;
    setUploadProgress({ ...uploadProgress, [collabId]: { percent: 0, current: 0, total, currentFile: files[0]?.name } });
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(prev => ({ ...prev, [collabId]: { ...prev[collabId], current: i + 1, total, currentFile: files[i].name, percent: 0 } }));
        try {
          const url = await uploadFileWithProgress(files[i], (percent) => {
            setUploadProgress(prev => ({ ...prev, [collabId]: { ...prev[collabId], percent, currentFile: files[i].name, current: i + 1, total } }));
          });
          urls.push(url);
        } catch (error) {
          console.error("Upload error:", error);
          const msg = error instanceof Error ? error.message : String(error);
          alert(`${t('workflow.uploadError')}: ${files[i].name}\n\n${msg}`);
        }
      }
      
        if (urls.length > 0) {
      const post = collaborations.find(c => c._id === collabId);
      if (!post) return;
          
          // Ajouter les médias au premier contentUpload existant ou en créer un nouveau
          const updatedUploads = [...(post.contentUploads || [])];
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur";
          const userRoleForUpload = isGraphiste ? "CREATIVE" : isDigital ? "DIGITAL_MARKETER" : "INFLUENCER";
          
          if (updatedUploads.length > 0 && updatedUploads[0].urls) {
            // Ajouter au premier contentUpload existant
            updatedUploads[0] = {
              ...updatedUploads[0],
              urls: [...(updatedUploads[0].urls || []), ...urls]
            };
          } else {
            // Créer un nouveau contentUpload
            updatedUploads.push({
              uploadedBy: userName,
              role: userRoleForUpload,
              urls: urls,
              description: "",
              uploadedAt: new Date().toISOString(),
              validatedByClient: false
            });
          }
          
      await fetch(`/api/collaborations/${collabId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentUploads: updatedUploads })
      });
          setCollaborations(collaborations.map(c => c._id === collabId ? { ...c, contentUploads: updatedUploads } : c));
          alert(`${urls.length} ${t('workflow.uploadSuccess')}`);
        }
    } catch (error) {
        console.error("Error in handleMediaUpload:", error);
        alert(t('workflow.uploadError'));
    } finally {
      setUploading({ ...uploading, [collabId]: false });
      setUploadProgress(prev => { const next = { ...prev }; delete next[collabId]; return next; });
    }
  };

  // Fonction helper pour calculer le nombre total de médias depuis contentUploads
  const getMediaCount = (collab: WorkflowCollaboration): number => {
    if (!collab.contentUploads || !Array.isArray(collab.contentUploads)) return 0;
    return collab.contentUploads.reduce((total, upload) => {
      return total + (upload.urls?.length || 0);
    }, 0);
  };

  // Fonction helper pour obtenir tous les URLs des médias depuis contentUploads
  const getAllMediaUrls = (collab: WorkflowCollaboration): string[] => {
    if (!collab.contentUploads || !Array.isArray(collab.contentUploads)) return [];
    const allUrls: string[] = [];
    collab.contentUploads.forEach(upload => {
      if (upload.urls && Array.isArray(upload.urls)) {
        allUrls.push(...upload.urls);
      }
    });
    return allUrls;
  };

  const handleRemoveMedia = async (collabId: string, mediaIndex: number) => {
    const post = collaborations.find(c => c._id === collabId);
    if (!post) return;
    
    // Trouver le contentUpload qui contient ce média
    let uploadIndex = -1;
    let urlIndex = -1;
    let currentIndex = 0;
    
    if (post.contentUploads && Array.isArray(post.contentUploads)) {
      for (let i = 0; i < post.contentUploads.length; i++) {
        const upload = post.contentUploads[i];
        if (upload.urls && Array.isArray(upload.urls)) {
          for (let j = 0; j < upload.urls.length; j++) {
            if (currentIndex === mediaIndex) {
              uploadIndex = i;
              urlIndex = j;
              break;
            }
            currentIndex++;
          }
          if (uploadIndex !== -1) break;
        }
      }
    }
    
    if (uploadIndex === -1 || urlIndex === -1) {
      alert(t('workflow.mediaRemoveError'));
      return;
    }
    
    // Supprimer le média du contentUpload
    const updatedUploads = [...(post.contentUploads || [])];
    updatedUploads[uploadIndex] = {
      ...updatedUploads[uploadIndex],
      urls: updatedUploads[uploadIndex].urls.filter((_, i) => i !== urlIndex)
    };
    
    try {
      await fetch(`/api/collaborations/${collabId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentUploads: updatedUploads })
      });
      setCollaborations(collaborations.map(c => c._id === collabId ? { ...c, contentUploads: updatedUploads } : c));
      alert(t('workflow.mediaRemoved'));
    } catch (error) {
      alert(t('workflow.mediaRemoveError'));
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/collaborations").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/influencers").then(r => r.json())
    ])
      .then(([collabsData, projectsData, influencersData]) => {
        setCollaborations(collabsData.collaborations || []);
        setProjects(projectsData.projects || []);
        setInfluencers(influencersData.influencers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Ouvrir la collaboration dont l'id est dans ?expand= (lien depuis le calendrier dashboard)
  const expandId = typeof router.query.expand === "string" ? router.query.expand : null;
  useEffect(() => {
    if (!expandId || collaborations.length === 0) return;
    const exists = collaborations.some(c => c._id === expandId);
    if (exists) {
      setExpandedCollaborations(prev => ({ ...prev, [expandId]: true }));
    }
  }, [expandId, collaborations]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleCreateCollaboration = async () => {
    try {
      const basePayload = {
        influencerId: newCollab.influencerId,
        projectId: newCollab.projectId,
        description: newCollab.description,
        descriptionIt: newCollab.descriptionIt?.trim() || undefined,
        captionFr: newCollab.captionFr?.trim() || undefined,
        captionIt: newCollab.captionIt?.trim() || undefined,
        contentType: newCollab.contentType,
        platforms: newCollab.platforms.length > 0 ? newCollab.platforms : undefined,
        budget: (parseFloat(String(newCollab.budget)) || 0),
        startDate: newCollab.startDate,
        endDate: newCollab.endDate
      };
      const url = editingCollabId
        ? `/api/collaborations/${editingCollabId}`
        : "/api/collaborations";
      const body = editingCollabId
        ? { ...basePayload, contentUploads: (editingContentUploads || []).map((u: any) => ({
            ...u,
            uploadedAt: u.uploadedAt ? (typeof u.uploadedAt === "string" ? u.uploadedAt : new Date(u.uploadedAt).toISOString()) : new Date().toISOString(),
            scheduledAt: u.scheduledAt ? (typeof u.scheduledAt === "string" ? u.scheduledAt : new Date(u.scheduledAt).toISOString()) : undefined,
            publishedAt: u.publishedAt ? (typeof u.publishedAt === "string" ? u.publishedAt : new Date(u.publishedAt).toISOString()) : undefined
          })) }
        : { ...basePayload, status: "DRAFT", createdBy: newCollab.createdBy };
      const response = await fetch(url, {
        method: editingCollabId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || (editingCollabId ? "Failed to update collaboration" : "Failed to create collaboration"));
      }
      setShowCreateModal(false);
      setEditingCollabId(null);
      setEditingContentUploads(null);
      setNewCollab({
        influencerId: "",
        projectId: "",
        contentType: "reel",
        platforms: [],
        description: "",
        descriptionIt: "",
        captionFr: "",
        captionIt: "",
        budget: "",
        startDate: "",
        endDate: "",
        createdBy: user ? `${user.firstName} ${user.lastName}`.trim() : "Digital Marketer"
      });
      const collabsRes = await fetch("/api/collaborations");
      const collabsData = await collabsRes.json();
      setCollaborations(collabsData.collaborations || []);
      alert(editingCollabId
        ? (t('collaborations.updateSuccess') || 'Collaboration modifiée avec succès')
        : (t('collaborations.createSuccess') || 'Collaboration créée avec succès'));
    } catch (error: any) {
      console.error("Error creating collaboration:", error);
      alert(t('collaborations.createError') || 'Erreur lors de la création de la collaboration: ' + (error?.message || ""));
    }
  };

  const openEditCollab = (collab: WorkflowCollaboration) => {
    setNewCollab({
      influencerId: collab.influencerId || "",
      projectId: collab.projectId || "",
      contentType: (collab as any).contentType === "story" ? "story" : "reel",
      platforms: Array.isArray((collab as any).platforms) ? (collab as any).platforms : [],
      description: collab.description || "",
      descriptionIt: (collab as any).descriptionIt || "",
      captionFr: (collab as any).captionFr || "",
      captionIt: (collab as any).captionIt || "",
      budget: String(collab.budget ?? ""),
      startDate: collab.startDate ? new Date(collab.startDate).toISOString().slice(0, 10) : "",
      endDate: collab.endDate ? new Date(collab.endDate).toISOString().slice(0, 10) : "",
      createdBy: user ? `${user.firstName} ${user.lastName}`.trim() : "Digital Marketer"
    });
    setEditingCollabId(collab._id);
    setEditingContentUploads(
      collab.contentUploads && collab.contentUploads.length > 0
        ? JSON.parse(JSON.stringify(collab.contentUploads))
        : [{ uploadedBy: user ? `${user.firstName} ${user.lastName}`.trim() : "User", role: "DIGITAL_MARKETER", urls: [], description: "", uploadedAt: new Date().toISOString(), validatedByClient: false }]
    );
    setShowCreateModal(true);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const getProjectNames = (collab: WorkflowCollaboration) => {
    // Si projectIds existe et n'est pas vide, utiliser projectIds
    // Sinon, utiliser projectId pour la compatibilité avec les anciennes collaborations
    const projectIdsToShow = (collab.projectIds && collab.projectIds.length > 0) 
      ? collab.projectIds 
      : [collab.projectId];
    
    return projectIdsToShow.map(id => getProjectName(id));
  };

  const getInfluencerName = (influencerId: string) => {
    const influencer = influencers.find(i => i._id === influencerId);
    return influencer?.name || influencerId;
  };

  const statusConfig: any = {
    DRAFT: { label: t('workflow.statuses.draft'), color: "#94a3b8", icon: FileText, order: 1 },
    PENDING_GRAPHIC: { label: t('workflow.statuses.creation'), color: "#8b5cf6", icon: Palette, order: 2 },
    CLIENT_REVIEW: { label: t('workflow.statuses.revision'), color: "#f59e0b", icon: Eye, order: 3 },
    SCHEDULED: { label: t('workflow.statuses.planned'), color: "#0284c7", icon: Calendar, order: 4 },
    PUBLISHED: { label: t('workflow.statuses.published'), color: "#10b981", icon: CheckCircle, order: 5 },
    PENDING_CORRECTION: { label: t('workflow.statuses.corrections'), color: "#f97316", icon: Edit, order: 6 },
    FAILED: { label: t('workflow.statuses.failed'), color: "#ef4444", icon: XCircle, order: 7 }
  };

  // Filtrer les collaborations selon le rôle de l'utilisateur (pour les statistiques)
  const collaborationsForStats = collaborations.filter(c => {
    // L'admin voit tous les posts (pas de filtre par rôle)
    if (isAdmin) {
      return true;
    }
    
    // Si l'utilisateur est un graphiste, ne montrer que les posts assignés à son rôle
    // + les posts en révision (CLIENT_REVIEW) pour qu'ils puissent voir les retours du client
    if (isGraphiste) {
      const assignedTo = getUserAssignedTo();
      if (assignedTo) {
        // Le graphiste voit :
        // - Les posts assignés à son rôle (infographiste ou video_motion)
        // - Les posts en révision (CLIENT_REVIEW) qui étaient initialement assignés à son rôle
        // - Les posts en correction (PENDING_CORRECTION) qui lui sont assignés
        const isAssignedToUser = c.assignedTo === assignedTo || 
               (assignedTo === 'infographiste' && (c.assignedTo === 'infographiste' || c.assignedTo === 'GRAPHIC_DESIGNER')) ||
               (assignedTo === 'video_motion' && c.assignedTo === 'video_motion');
        
        // Voir aussi les posts en révision (CLIENT_REVIEW) qui ont été soumis par ce graphiste
        // On vérifie les commentaires pour voir qui a fait SUBMIT_GRAPHIC
        const hasSubmittedByUser = c.comments?.some((comment: any) => 
          comment.role === 'GRAPHIC_DESIGNER' && 
          (comment.text?.toLowerCase().includes('soumis') || comment.text?.toLowerCase().includes('submitted') || comment.text?.toLowerCase().includes('submit'))
        );
        const isInReview = c.status === 'CLIENT_REVIEW';
        
        // Voir les posts en correction qui lui sont assignés
        const isInCorrection = c.status === 'PENDING_CORRECTION' && (c.assignedTo === assignedTo || c.assignedTo === 'GRAPHIC_DESIGNER');
        
        return isAssignedToUser || isInReview || isInCorrection;
      }
    }
    // Pour les autres rôles (client, digital), afficher tous les posts
    return true;
  });

  const collaborationsByStatus = collaborationsForStats.reduce((acc: any, collab) => {
    acc[collab.status] = (acc[collab.status] || 0) + 1;
    return acc;
  }, {});

  // Filtrer les collaborations selon le rôle de l'utilisateur
  const filteredCollaborations = collaborations
    .filter(c => {
      // L'admin voit tous les posts (pas de filtre par rôle)
      if (isAdmin) {
        return true;
      }
      
      // Si l'utilisateur est un graphiste, ne montrer que les collaborations assignées à son rôle
      // + les collaborations en révision (CLIENT_REVIEW) pour qu'ils puissent voir les retours du client
      if (isGraphiste) {
        const assignedTo = getUserAssignedTo();
        if (assignedTo) {
          // Le graphiste voit :
          // - Les collaborations assignées à son rôle (infographiste ou video_motion)
          // - Les collaborations en révision (CLIENT_REVIEW) qui étaient initialement assignées à son rôle
          // - Les collaborations en correction (PENDING_CORRECTION) qui lui sont assignées
          const isAssignedToUser = c.assignedTo === assignedTo || 
                 (assignedTo === 'infographiste' && (c.assignedTo === 'infographiste' || c.assignedTo === 'GRAPHIC_DESIGNER')) ||
                 (assignedTo === 'video_motion' && c.assignedTo === 'video_motion');
          
          // Voir aussi les collaborations en révision (CLIENT_REVIEW) qui ont été soumises par ce graphiste
          // On vérifie les commentaires pour voir qui a fait SUBMIT_GRAPHIC
          const hasSubmittedByUser = c.comments?.some((comment: any) => 
            comment.role === 'GRAPHIC_DESIGNER' && 
            (comment.text?.toLowerCase().includes('soumis') || comment.text?.toLowerCase().includes('submitted') || comment.text?.toLowerCase().includes('submit'))
          );
          const isInReview = c.status === 'CLIENT_REVIEW';
          
          // Voir les collaborations en correction qui lui sont assignées
          const isInCorrection = c.status === 'PENDING_CORRECTION' && (c.assignedTo === assignedTo || c.assignedTo === 'GRAPHIC_DESIGNER');
          
          return isAssignedToUser || isInReview || isInCorrection;
        }
      }
      // Pour les autres rôles (client, digital), afficher toutes les collaborations
      return true;
    })
    .filter(c => filter === "all" || c.status === filter)
    .filter(c => {
      if (projectFilter === "all") return true;
      
      // Vérifier si la collaboration est associée au projet filtré
      const projectIdsToCheck = (c.projectIds && c.projectIds.length > 0) 
        ? c.projectIds 
        : [c.projectId];
      
      return projectIdsToCheck.includes(projectFilter);
    })
    .filter(c => {
      if (!keywordFilter.trim()) return true;
      const q = keywordFilter.trim().toLowerCase();
      const desc = (getDisplayDescription(c) || "").toLowerCase();
      const projectNames = getProjectNames(c).join(" ").toLowerCase();
      const infName = (getInfluencerName(c.influencerId) || "").toLowerCase();
      const caption = ((c as any).captionFr || (c as any).captionIt || "").toLowerCase();
      const hashtags = ((c as any).hashtags || "").toLowerCase();
      return desc.includes(q) || projectNames.includes(q) || infName.includes(q) || caption.includes(q) || hashtags.includes(q);
    })
    .sort((a, b) => {
      const getScheduledDate = (collab: WorkflowCollaboration) => {
        const rootScheduled = (collab as any).scheduledAt;
        if (rootScheduled) return new Date(rootScheduled).getTime();
        const firstUploadScheduled = collab.contentUploads?.find(u => u.scheduledAt)?.scheduledAt;
        if (firstUploadScheduled) return new Date(firstUploadScheduled).getTime();
        if (collab.endDate) return new Date(collab.endDate).getTime();
        if (collab.startDate) return new Date(collab.startDate).getTime();
        return 0;
      };
      const timeA = getScheduledDate(a);
      const timeB = getScheduledDate(b);
      if (sortByDate === "newest") {
        return timeB - timeA;
      }
      return timeA - timeB;
    });

  const toggleExpand = (collabId: string) => {
    setExpandedCollaborations({ ...expandedCollaborations, [collabId]: !expandedCollaborations[collabId] });
  };

  // Fonctions pour la vue calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getCollaborationsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    return filteredCollaborations.filter(collab => {
      // Pour les collaborations, on utilise endDate ou startDate pour le calendrier
      const collabDate = collab.endDate ? new Date(collab.endDate) : new Date(collab.startDate);
      const matchesDate = collabDate.getDate() === day && 
                           collabDate.getMonth() === month && 
                           collabDate.getFullYear() === year;
      return matchesDate;
    });
  };

  const prevMonth = () => {
    const { year, month } = getDaysInMonth(currentDate);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    const { year, month } = getDaysInMonth(currentDate);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="page-content">
      <div className="dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
          { label: t('menu.dashboard'), href: '/' },
          { label: t('menu.collaborations') || 'Collaborations' }
        ]} />
              </div>
              <h1 className="page-hero-title">{t('menu.collaborations') || 'Collaborations'}</h1>
              <p className="page-hero-subtitle">
                {t('collab.workflowSubtitle') || 'Gérez le workflow de vos collaborations avec les influenceurs'}
              </p>
            </div>
            {isDigital && (
              <div className="page-hero-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="page-hero-btn"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  {t('collaborations.newCollaboration') || 'Nouvelle Collaboration'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Cards - même style que workflow */}
        <div className="workflow-status-cards">
          {Object.keys(statusConfig)
            .sort((a, b) => statusConfig[a].order - statusConfig[b].order)
            .map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const count = collaborationsByStatus[status] || 0;
              const isActive = filter === status;
              return (
                <div
                  key={status}
                  className={`workflow-status-card ${isActive ? "workflow-status-card-active" : ""}`}
                  style={{
                    background: isActive ? `${config.color}12` : undefined,
                    borderColor: isActive ? config.color : undefined
                  }}
                  onClick={() => setFilter(filter === status ? "all" : status)}
                >
                  <div className="workflow-status-icon">
                    <Icon size={20} strokeWidth={2} style={{ color: config.color }} />
                  </div>
                  <div className="workflow-status-value" style={{ color: config.color }}>
                    {count}
                  </div>
                  <div className="workflow-status-label">{config.label}</div>
                </div>
              );
            })}
        </div>

        <section className="dash-section workflow-section">
          <div className="dash-calendar-card">
            <div className="dash-calendar-toolbar">
              <div className="dash-filter-group">
                <label className="dash-filter-label">{t('workflow.project')}</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="dash-filter-select"
                  style={{ minWidth: "180px" }}
                >
                  <option value="all">{t('workflow.allProjects')}</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dash-filter-group">
                <label className="dash-filter-label">Recherche par mots-clés</label>
                <input
                  type="search"
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                  placeholder="Description, projet, influenceur..."
                  className="dash-filter-select"
                  style={{ minWidth: "220px" }}
                />
              </div>
              <div className="dash-filter-group">
                <label className="dash-filter-label">Tri par date de publication prévue</label>
                <select
                  value={sortByDate}
                  onChange={(e) => setSortByDate(e.target.value as "newest" | "oldest")}
                  className="dash-filter-select"
                  style={{ minWidth: "160px" }}
                >
                  <option value="newest">Plus récentes</option>
                  <option value="oldest">Plus anciennes</option>
                </select>
              </div>
              {!isAdmin && isGraphiste && (
                <div className="workflow-role-badge">
                  {getUserAssignedTo() === 'infographiste' ? '🎨 Infographiste' : getUserAssignedTo() === 'video_motion' ? '🎬 Video Motion' : '🎯 Graphiste'}
                </div>
              )}
            </div>
            <div className="dash-calendar-body">
        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="workflow-content-card">
            <div className="workflow-calendar-nav">
              <button
                onClick={prevMonth}
                className="workflow-calendar-nav-btn"
              >
                <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
                Précédent
              </button>
              <h2>
                {monthNames[getDaysInMonth(currentDate).month]} {getDaysInMonth(currentDate).year}
              </h2>
              <button
                onClick={nextMonth}
                className="workflow-calendar-nav-btn"
              >
                Suivant
                <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>

            <div className="workflow-calendar-weekdays">
              {dayNames.map(day => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="workflow-calendar-grid">
              {Array.from({ length: getDaysInMonth(currentDate).startingDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} style={{ minHeight: "100px" }} />
              ))}
              {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayCollaborations = getCollaborationsForDay(day);
                const isToday = new Date().toDateString() === new Date(getDaysInMonth(currentDate).year, getDaysInMonth(currentDate).month, day).toDateString();
                return (
                  <div
                    key={day}
                    className={`workflow-calendar-day-cell ${isToday ? "is-today" : ""}`}
                  >
                    <div className="workflow-calendar-day-num">
                      {day}
                    </div>
                    <div className="workflow-calendar-day-events">
                      {dayCollaborations.slice(0, 3).map(collab => {
                        const statusInfo = statusConfig[collab.status] || statusConfig.DRAFT;
                        return (
                          <div
                            key={collab._id}
                            className="workflow-calendar-day-event"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCollabInCalendar(collab);
                            }}
                            style={{ background: statusInfo.color }}
                            title={getDisplayDescription(collab) || ""}
                          >
                            🤝 {getDisplayDescription(collab)?.substring(0, 15) || "Collab"}...
                          </div>
                        );
                      })}
                      {dayCollaborations.length > 3 && (
                        <div className="workflow-calendar-day-more">
                          +{dayCollaborations.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal détails collaboration depuis calendrier */}
        {selectedCollabInCalendar && viewMode === "calendar" && (
          <div
            className="collab-detail-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedCollabInCalendar(null);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="collab-detail-title"
          >
            <div
              className="collab-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="collab-detail-modal-header">
                <div style={{ flex: 1 }}>
                  {(() => {
                    const collab = selectedCollabInCalendar;
                    if (!collab) return null;
                    const statusInfo = statusConfig[collab.status] || statusConfig.DRAFT;
                    const StatusIcon = statusInfo.icon;
                    const badgeLabel = collab.status === 'CLIENT_REVIEW' ? (t('workflow.statuses.revisionLabel') || 'COLLABORATION EN RÉVISION') : statusInfo.label;
                    return (
                      <span
                        className="collab-detail-badge"
                        style={{ background: statusInfo.color, color: "white" }}
                      >
                        <StatusIcon size={12} />
                        {badgeLabel}
                      </span>
                    );
                  })()}
                  <h2 id="collab-detail-title" className="collab-detail-modal-title">
                    Détails de la collaboration
                  </h2>
                </div>
                {(() => {
                  if (!selectedCollabInCalendar) return null;
                  const selDate = selectedCollabInCalendar.endDate ? new Date(selectedCollabInCalendar.endDate) : new Date(selectedCollabInCalendar.startDate);
                  const dayNum = selDate.getDate();
                  const month = selDate.getMonth();
                  const year = selDate.getFullYear();
                  const dayCollaborations = filteredCollaborations.filter(c => {
                    const d = c.endDate ? new Date(c.endDate) : new Date(c.startDate);
                    return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
                  });
                  const currentIndex = dayCollaborations.findIndex(c => c._id === selectedCollabInCalendar._id);
                  const hasMultiple = dayCollaborations.length > 1;
                  if (!hasMultiple) return null;
                  const goPrev = () => { if (currentIndex > 0) setSelectedCollabInCalendar(dayCollaborations[currentIndex - 1]); };
                  const goNext = () => { if (currentIndex < dayCollaborations.length - 1) setSelectedCollabInCalendar(dayCollaborations[currentIndex + 1]); };
                  return (
                    <div className="collab-detail-nav">
                      <button type="button" onClick={goPrev} disabled={currentIndex <= 0} aria-label={t('common.previous')} className="collab-detail-nav-btn">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                      </button>
                      <span className="collab-detail-nav-counter">{currentIndex + 1} / {dayCollaborations.length}</span>
                      <button type="button" onClick={goNext} disabled={currentIndex >= dayCollaborations.length - 1} aria-label={t('common.next')} className="collab-detail-nav-btn">
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {selectedCollabInCalendar && isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        openEditCollab(selectedCollabInCalendar);
                        setSelectedCollabInCalendar(null);
                      }}
                      className="btn-meta btn-meta-secondary"
                      style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                    >
                      <Edit size={16} strokeWidth={2.5} />
                      {t('common.edit')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="collab-detail-modal-close"
                    onClick={() => setSelectedCollabInCalendar(null)}
                    aria-label="Fermer"
                    >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="collab-detail-modal-body">
                {(() => {
                  const collab = selectedCollabInCalendar;
                  if (!collab) return null;
                  const statusInfo = statusConfig[collab.status] || statusConfig.DRAFT;
                  const StatusIcon = statusInfo.icon;
                  const getProjectNamesLocal = (p: WorkflowCollaboration) => {
                    if (p.projectIds && p.projectIds.length > 0) {
                      return p.projectIds.map(id => {
                        const project = projects.find(proj => proj._id === id);
                        return project?.name || id;
                      });
                    }
                    const project = projects.find(proj => proj._id === p.projectId);
                    return project ? [project.name] : [p.projectId];
                  };

                  return (
                    <>
                      {/* Informations principales en grille compacte (6 cartes comme maquette) */}
                      <div className="collab-detail-cards">
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">INFLUENCEUR</div>
                          <div className="collab-detail-card-value">
                            {getInfluencerName(collab.influencerId)}
                          </div>
                        </div>
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">PROJETS</div>
                          <div className="collab-detail-card-value">
                            {getProjectNamesLocal(collab).map((name, idx) => (
                              <span key={idx}>
                                {idx > 0 && <span style={{ margin: "0 4px", color: "var(--color-text-tertiary)" }}>·</span>}
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                        {canSeeBudgetAndTarifs() && collab.budget != null && (
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">BUDGET</div>
                          <div className="collab-detail-card-value collab-detail-budget-value">
                            {Number(collab.budget).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </div>
                        </div>
                        )}
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">DATES</div>
                          <div className="collab-detail-card-value" style={{ fontSize: "12px" }}>
                            {new Date(collab.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {collab.startDate !== collab.endDate && (
                              <> → {new Date(collab.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                            )}
                          </div>
                        </div>
                        {(collab as WorkflowCollaboration).createdBy && (
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">CRÉÉ PAR</div>
                          <div className="collab-detail-card-value" style={{ fontSize: "12px" }}>
                            {(collab as WorkflowCollaboration).createdBy}
                          </div>
                        </div>
                        )}
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">STATUT</div>
                          <div className="collab-detail-card-value">
                            {statusInfo.label}
                          </div>
                        </div>
                      </div>

                      {/* Description (français) */}
                      {collab.description && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">DESCRIPTION (FRANÇAIS)</div>
                          <p className="collab-detail-description">
                            {getDisplayDescription(collab)}
                          </p>
                        </div>
                      )}

                      {/* Description (italien) */}
                      {(collab as WorkflowCollaboration).descriptionIt && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">{t('collaborations.descriptionItLabel') || 'DESCRIPTION (ITALIEN)'}</div>
                          <p className="collab-detail-description">
                            {(collab as WorkflowCollaboration).descriptionIt}
                          </p>
                        </div>
                      )}

                      {/* Aperçu vidéo : premier média vidéo en grand */}
                      {collab.contentUploads && (() => {
                        const firstVideoUrl = collab.contentUploads!.flatMap((u: any) => u.urls || [])
                          .find((url: string) => url.match(/\.mp4($|\?)/i));
                        if (!firstVideoUrl) return null;
                        const normalizedUrl = getMediaUrlForContext(firstVideoUrl, "workflow");
                        return (
                          <div className="collab-detail-section">
                            <div className="collab-detail-section-title">APERÇU VIDÉO</div>
                            <div className="collab-detail-video-preview">
                              <video
                                src={normalizedUrl}
                                controls
                                playsInline
                                className="collab-detail-video-player"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Autres médias en grille (si plusieurs) */}
                      {collab.contentUploads && collab.contentUploads.some((upload: any) => upload.urls && upload.urls.length > 0) && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">Médias</div>
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                            gap: "var(--spacing-3)"
                          }}>
                            {collab.contentUploads.flatMap((upload: any) =>
                              (upload.urls || []).map((url: string, idx: number) => {
                                const normalizedUrl = getMediaUrlForContext(url, "workflow");
                                const isVideo = url.match(/\.mp4($|\?)/i);
                                return (
                                  <div
                                    key={`${upload.uploadedAt}-${idx}`}
                                    onClick={() => window.open(normalizedUrl, '_blank')}
                                    style={{
                                      aspectRatio: "1",
                                      borderRadius: "var(--border-radius-base)",
                                      overflow: "hidden",
                                      cursor: "pointer",
                                      border: "2px solid var(--color-border)",
                                      transition: "all var(--transition-fast)"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = "scale(1.05)";
                                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = "scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    {isVideo ? (
                                      <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                      <img src={normalizedUrl} alt={`Media ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                    <div style={{
                                      position: "absolute",
                                      bottom: "0.375rem",
                                      left: "0.375rem",
                                      padding: "0.25rem 0.5rem",
                                      background: "rgba(0,0,0,0.7)",
                                      backdropFilter: "blur(10px)",
                                      borderRadius: "4px",
                                      fontSize: "0.625rem",
                                      color: "white",
                                      fontWeight: "700"
                                    }}>
                                      {isVideo ? "🎥" : "🖼️"}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Content Uploads publiés */}
                      {collab.contentUploads && collab.contentUploads.filter((upload: any) => upload.publishedAt).length > 0 && (
                        <div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-3)",
                            marginBottom: "var(--spacing-5)",
                            paddingBottom: "var(--spacing-4)",
                            borderBottom: "2px solid var(--color-border)"
                          }}>
                            <div style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "var(--border-radius-lg)",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "var(--font-size-xl)",
                              boxShadow: "var(--shadow-md)"
                            }}>
                              📊
                            </div>
                            <div>
                              <h3 style={{
                                fontSize: "var(--font-size-2xl)",
                                fontWeight: "var(--font-weight-bold)",
                                margin: 0,
                                color: "var(--color-text-primary)"
                              }}>
                                Performance
                              </h3>
                              <p style={{
                                fontSize: "var(--font-size-sm)",
                                color: "var(--color-text-secondary)",
                                margin: "var(--spacing-1) 0 0 0"
                              }}>
                                {collab.contentUploads.filter((upload: any) => upload.publishedAt).length} contenu(s) publié(s)
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                            {collab.contentUploads.filter((upload: any) => upload.publishedAt).map((upload: any, idx: number) => (
                              <div
                                key={idx}
                                className="card-meta"
                                style={{
                                  padding: "var(--spacing-4)",
                                  borderLeft: "3px solid var(--color-success)",
                                  background: "var(--color-white)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--border-radius-base)",
                                  transition: "all var(--transition-fast)"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                  e.currentTarget.style.transform = "translateX(2px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = "none";
                                  e.currentTarget.style.transform = "translateX(0)";
                                }}
                              >
                                {/* Header avec badge, date et plateforme */}
                                <div style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "var(--spacing-2)",
                                  marginBottom: "var(--spacing-3)",
                                  paddingBottom: "var(--spacing-2)",
                                  borderBottom: "1px solid var(--color-border)"
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "var(--spacing-2)",
                                      marginBottom: "var(--spacing-1)",
                                      flexWrap: "wrap"
                                    }}>
                                      <span style={{
                                        padding: "2px 8px",
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        borderRadius: "4px",
                                        fontSize: "10px",
                                        fontWeight: "var(--font-weight-bold)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                      }}>
                                        ✓ Publié
                                      </span>
                                      {upload.platform && (
                                        <span style={{
                                          padding: "2px 8px",
                                          background: "var(--color-gray-100)",
                                          borderRadius: "4px",
                                          fontSize: "10px",
                                          fontWeight: "var(--font-weight-semibold)",
                                          textTransform: "capitalize",
                                          color: "var(--color-text-primary)",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px"
                                        }}>
                                          {upload.platform === "instagram" ? "📷" :
                                           upload.platform === "facebook" ? "📘" :
                                           upload.platform === "tiktok" ? "🎵" :
                                           upload.platform === "youtube" ? "▶️" :
                                           upload.platform === "x" ? "🐦" :
                                           upload.platform === "linkedin" ? "💼" : "📱"} {upload.platform}
                                        </span>
                                      )}
                                    </div>
                                    {upload.publishedAt && (
                                      <div style={{
                                        fontSize: "11px",
                                        color: "var(--color-text-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}>
                                        <span>📅</span>
                                        <span>{new Date(upload.publishedAt).toLocaleString('fr-FR', {
                                          day: 'numeric',
                                          month: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Lien vers la publication et Statistiques côte à côte */}
                                <div style={{
                                  display: "flex",
                                  gap: "var(--spacing-3)",
                                  alignItems: "flex-start"
                                }}>
                                  {/* Lien vers la publication */}
                                  {upload.platform && (
                                    <div style={{
                                      flexShrink: 0
                                    }}>
                                      {upload.postUrl ? (
                                        <a
                                          href={upload.postUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "var(--spacing-2)",
                                            padding: "var(--spacing-3) var(--spacing-4)",
                                            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                                            color: "white",
                                            borderRadius: "var(--border-radius-base)",
                                            textDecoration: "none",
                                            fontSize: "13px",
                                            fontWeight: "var(--font-weight-semibold)",
                                            transition: "all var(--transition-fast)",
                                            boxShadow: "var(--shadow-sm)",
                                            border: "none"
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                          }}
                                        >
                                          <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            background: "rgba(255, 255, 255, 0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "16px"
                                          }}>
                                            {upload.platform === "instagram" ? "📷" :
                                             upload.platform === "facebook" ? "📘" :
                                             upload.platform === "tiktok" ? "🎵" :
                                             upload.platform === "youtube" ? "▶️" :
                                             upload.platform === "x" ? "🐦" :
                                             upload.platform === "linkedin" ? "💼" : "📱"}
                                          </div>
                                          <span style={{ flex: 1 }}>
                                            {upload.platform.charAt(0).toUpperCase() + upload.platform.slice(1)}
                                          </span>
                                          <ExternalLink size={16} strokeWidth={2.5} />
                                        </a>
                                      ) : (
                                        <div style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "var(--spacing-2)",
                                          padding: "var(--spacing-3) var(--spacing-4)",
                                          background: "var(--color-gray-100)",
                                          borderRadius: "var(--border-radius-base)",
                                          fontSize: "12px",
                                          color: "var(--color-text-secondary)",
                                          fontStyle: "italic",
                                          border: "1px solid var(--color-border)"
                                        }}>
                                          <span>🔗</span>
                                          <span>Aucun lien disponible</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Statistiques */}
                                  {upload.insights && Object.values(upload.insights).some(Boolean) && (
                                    <div style={{
                                      display: "flex",
                                      gap: "var(--spacing-2)",
                                      flexWrap: "nowrap",
                                      overflowX: "auto",
                                      flex: "1 1 0",
                                      paddingBottom: "var(--spacing-2)"
                                    }}>
                                      {upload.insights.views !== undefined && (
                                        <div className="card-meta" style={{
                                          padding: "var(--spacing-2) var(--spacing-3)",
                                          minWidth: "80px",
                                          textAlign: "center",
                                          background: "var(--color-gray-50)",
                                          border: "1px solid var(--color-border)",
                                          transition: "all var(--transition-fast)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                        }}
                                        >
                                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>VUES</div>
                                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{upload.insights.views.toLocaleString()}</div>
                                        </div>
                                      )}
                                      {upload.insights.saves !== undefined && (
                                        <div className="card-meta" style={{
                                          padding: "var(--spacing-2) var(--spacing-3)",
                                          minWidth: "80px",
                                          textAlign: "center",
                                          background: "var(--color-gray-50)",
                                          border: "1px solid var(--color-border)",
                                          transition: "all var(--transition-fast)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                        }}
                                        >
                                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>ENREG.</div>
                                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{upload.insights.saves.toLocaleString()}</div>
                                        </div>
                                      )}
                                      {upload.insights.likes !== undefined && (
                                        <div className="card-meta" style={{
                                          padding: "var(--spacing-2) var(--spacing-3)",
                                          minWidth: "80px",
                                          textAlign: "center",
                                          background: "var(--color-gray-50)",
                                          border: "1px solid var(--color-border)",
                                          transition: "all var(--transition-fast)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                        }}
                                        >
                                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>LIKES</div>
                                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{upload.insights.likes.toLocaleString()}</div>
                                        </div>
                                      )}
                                      {upload.insights.comments !== undefined && (
                                        <div className="card-meta" style={{
                                          padding: "var(--spacing-2) var(--spacing-3)",
                                          minWidth: "80px",
                                          textAlign: "center",
                                          background: "var(--color-gray-50)",
                                          border: "1px solid var(--color-border)",
                                          transition: "all var(--transition-fast)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                        }}
                                        >
                                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>COMM.</div>
                                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{upload.insights.comments.toLocaleString()}</div>
                                        </div>
                                      )}
                                      {upload.insights.shares !== undefined && (
                                        <div className="card-meta" style={{
                                          padding: "var(--spacing-2) var(--spacing-3)",
                                          minWidth: "80px",
                                          textAlign: "center",
                                          background: "var(--color-gray-50)",
                                          border: "1px solid var(--color-border)",
                                          transition: "all var(--transition-fast)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                        }}
                                        >
                                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>PART.</div>
                                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{upload.insights.shares.toLocaleString()}</div>
                                        </div>
                                      )}
                                      {upload.insights.engagement_rate !== undefined && (
                                        <div className="card-meta" style={{
                                          padding: "var(--spacing-2) var(--spacing-3)",
                                          minWidth: "80px",
                                          textAlign: "center",
                                          background: "var(--color-gray-50)",
                                          border: "1px solid var(--color-border)",
                                          transition: "all var(--transition-fast)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                        }}
                                        >
                                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>RER%</div>
                                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{upload.insights.engagement_rate.toFixed(2)}%</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Bouton pour ouvrir dans la vue liste */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-2)", marginTop: "var(--spacing-6)" }}>
                      <button
                        onClick={() => {
                          setViewMode("list");
                          setSelectedCollabInCalendar(null);
                          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                          scrollTimeoutRef.current = setTimeout(() => {
                            const element = document.getElementById(`collab-${collab._id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth", block: "center" });
                              setExpandedCollaborations({ ...expandedCollaborations, [collab._id]: true });
                            }
                            scrollTimeoutRef.current = null;
                          }, 100);
                        }}
                        className="btn-meta btn-meta-primary"
                        style={{ padding: "var(--spacing-2) var(--spacing-4)" }}
                      >
                        Voir dans la liste
                      </button>
                    </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        {viewMode === "list" && (
          <>
            {loading ? (
              <div className="workflow-loading">
                <Clock size={48} strokeWidth={1} className="workflow-loading-icon" />
                <p className="workflow-loading-title">{t('common.loading')}</p>
              </div>
            ) : filteredCollaborations.length === 0 ? (
              <div className="workflow-empty">
                <Users size={48} strokeWidth={1} className="workflow-empty-icon" />
                <h3 className="workflow-empty-title">
                  {t('collab.noCollaborations') || 'Aucune collaboration'}
                </h3>
                <p className="workflow-empty-desc">
                  {t('collab.createFirst') || 'Aucune collaboration pour le moment. Créez-en une pour commencer.'}
                </p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="workflow-btn-primary"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  {t('collaborations.newCollaboration') || 'Nouvelle Collaboration'}
                </button>
              </div>
            ) : (
          <div className="workflow-list">
            {filteredCollaborations.map((collab) => {
              const statusInfo = statusConfig[collab.status] || statusConfig.DRAFT;
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedCollaborations[collab._id];
              
                // Local state component for comment input
              const CollabCommentInput = () => {
                const [localComment, setLocalComment] = useState("");
                
                // Sync local comment when global state is cleared (after comment sent)
                useEffect(() => {
                  // Only clear if global state is empty and local is not
                  if (!comments[collab._id] && localComment) {
                    setLocalComment("");
                  }
                }, [comments[collab._id]]);
                
                // Handle comment submission
                const handleLocalAddComment = async () => {
                  if (!localComment.trim()) return;
                  
                  const textToSend = localComment.trim();
                  // Clear local input immediately for better UX
                  setLocalComment("");
                  
                  try {
                    const collabData = collaborations.find(c => c._id === collab._id);
                    if (!collabData) return;
                    
                    // Utiliser le nom réel de l'utilisateur connecté
                    const userName = user ? `${user.firstName} ${user.lastName}` : 
                      (userRole === 'digital' ? t('workflow.digitalMarketer') : 
                       userRole === 'client' ? t('workflow.client') : 
                       user?.role === 'video_motion' ? t('workflow.videoMotion') : t('workflow.graphiste'));
                    
                    // Mapper le rôle de l'utilisateur vers le format attendu
                    const getRoleForComment = (): "DIGITAL_MARKETER" | "GRAPHIC_DESIGNER" | "CLIENT" | "ADMIN" => {
                      if (isAdmin) return 'ADMIN';
                      if (isDigital) return 'DIGITAL_MARKETER';
                      if (isClient) return 'CLIENT';
                      // Graphiste et Vidéo Motion sont tous deux GRAPHIC_DESIGNER pour les commentaires
                      return 'GRAPHIC_DESIGNER';
                    };
                    
                    const newComment = {
                      user: userName,
                      role: getRoleForComment(),
                      text: textToSend,
                      createdAt: new Date().toISOString()
                    };
                    
                    // Update local state optimistically
                    const updatedPosts = collaborations.map(c => 
                      c._id === collab._id 
                        ? { ...c, comments: [...(c.comments || []), newComment] }
                        : c
                    );
                    setCollaborations(updatedPosts);
                    
                    // Clear global state
                    setComments(prev => ({ ...prev, [collab._id]: "" }));
                    
                    // Sync with server
                    await fetch(`/api/collaborations/${collab._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        comments: [...(collabData.comments || []), newComment]
                      })
                    });
                    
                    // Refresh data in background (without blocking)
                    // Reload collaborations to sync with server
                    const refreshResponse = await fetch('/api/collaborations');
                    if (refreshResponse.ok) {
                      const refreshData = await refreshResponse.json();
                      setCollaborations(refreshData.collaborations || []);
                    }
                  } catch (error) {
                    console.error("Error adding comment:", error);
                    // Restore comment text on error
                    setLocalComment(textToSend);
                    // Reload data to get server state
                    const refreshResponse = await fetch('/api/collaborations');
                    if (refreshResponse.ok) {
                      const refreshData = await refreshResponse.json();
                      setCollaborations(refreshData.collaborations || []);
                    }
                    alert(t('workflow.commentError'));
                  }
                };
                
                return (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder={t('workflow.addComment')}
                      value={localComment}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setLocalComment(newValue);
                      }}
                      style={{ flex: 1, padding: "0.625rem", fontSize: "0.8125rem", borderRadius: "6px" }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && localComment.trim()) {
                          e.preventDefault();
                          handleLocalAddComment();
                        }
                      }}
                    />
                    <button
                      className="btn-meta btn-meta-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLocalAddComment();
                      }}
                      disabled={!localComment.trim()}
                      style={{ 
                        padding: "0.625rem 0.875rem", 
                        display: "flex", 
                        gap: "0.375rem", 
                        alignItems: "center",
                        opacity: localComment.trim() ? 1 : 0.5,
                        cursor: localComment.trim() ? "pointer" : "not-allowed"
                      }}
                    >
                      <Send size={12} strokeWidth={2} />
                    </button>
                  </div>
                );
              };

              return (
                <div 
                  id={`collab-${collab._id}`}
                  key={collab._id} 
                  className="workflow-post-card"
                  style={{ 
                    borderLeft: `4px solid ${statusInfo.color}`,
                    background: `${statusInfo.color}12`,
                  }}
                >
                  {/* Compact Header */}
                  <div 
                    className="workflow-post-card-header"
                    style={{ background: `${statusInfo.color}18` }}
                    onClick={() => toggleExpand(collab._id)}
                  >
                    <div>
                      {/* Badges Row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        <span style={{
                          background: statusInfo.color,
                          color: "white",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "4px",
                          fontSize: "0.6875rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem"
                        }}>
                          <StatusIcon size={12} strokeWidth={2.5} />
                          {statusInfo.label}
                        </span>

                        {/* Project and Influencer Info */}
                        {getProjectNames(collab).map((projectName, idx) => (
                          <span 
                            key={`project-${idx}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "var(--color-white)",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "1.5px solid var(--color-primary)",
                              fontSize: "0.6875rem",
                              fontWeight: "600",
                              color: "var(--color-primary)"
                            }}
                          >
                            <Briefcase size={12} strokeWidth={2} />
                            {projectName}
                          </span>
                        ))}
                        <span 
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            background: "var(--color-white)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            border: "1.5px solid var(--color-secondary)",
                            fontSize: "0.6875rem",
                            fontWeight: "600",
                            color: "var(--color-secondary)"
                          }}
                        >
                          <User size={12} strokeWidth={2} />
                          {getInfluencerName(collab.influencerId)}
                        </span>

                        {collab.assignedTo && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            fontSize: "0.6875rem",
                            color: "white",
                            background: collab.assignedTo === "infographiste" 
                              ? "linear-gradient(135deg, #ec4899, #db2777)" 
                              : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "6px",
                            fontWeight: "700"
                          }}>
                            {collab.assignedTo === "infographiste" ? (
                              <>
                                <Palette size={12} strokeWidth={2.5} />
                                Infographiste
                              </>
                            ) : (
                              <>
                                <Monitor size={12} strokeWidth={2.5} />
                                Vidéo Motion
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Caption Preview */}
                      <p style={{ 
                        fontSize: "0.9375rem", 
                        fontWeight: "500",
                        color: "var(--color-text-primary)",
                        marginBottom: "0.5rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        lineHeight: 1.4
                      }}>
                        {getDisplayDescription(collab) || t('posts.withoutCaption')}
                      </p>

                      {/* Meta info */}
                      <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem", color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                        <span>📅 {new Date(collab.startDate).toLocaleDateString()}</span>
                        <span>💬 {collab.comments?.length || 0} {t('common.comments')}</span>
                        <span>📷 {getMediaCount(collab)} {t('common.media')}</span>
                        {canSeeBudgetAndTarifs() && collab.budget != null && (
                          <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>💰 {Number(collab.budget).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        )}
                      </div>
                    </div>

                    {/* Expand button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {canUpdate("workflowCollab") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCollab(collab);
                          }}
                          className="btn-meta btn-meta-secondary"
                          style={{
                            padding: "0.375rem 0.75rem",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem"
                          }}
                          title={t('common.edit')}
                        >
                          <Edit size={14} strokeWidth={2.5} />
                          {t('common.edit')}
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={20} color="var(--color-text-secondary)" /> : <ChevronDown size={20} color="var(--color-text-secondary)" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <>
                    <div className="workflow-post-card-body">
                        {/* Pour les posts PUBLISHED, afficher uniquement caption + médias */}
                        {collab.status === 'PUBLISHED' ? (
                          <>
                            {collab.description && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                  {t('common.caption')}
                                </div>
                                <p style={{ fontSize: "0.9375rem", color: "#111", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                  {getDisplayDescription(collab)}
                                </p>
                              </div>
                            )}

                            {/* Media Section */}
                            {(() => {
                              const mediaUrls = getAllMediaUrls(collab);
                              if (mediaUrls.length === 0) return null;
                              return (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ 
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.75rem"
                                }}>
                                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontWeight: "700", textTransform: "uppercase" }}>
                                      📷 {t('workflow.mediaCount')} ({mediaUrls.length})
                                  </span>
                                </div>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                                    {mediaUrls.map((url, idx) => {
                                    const normalizedUrl = getMediaUrlForContext(url, "workflow");
                                    const isVideo = url.match(/\.mp4($|\?)/i);
                                    return (
                                      <div 
                                        key={idx} 
                                        data-video-wrap
                                        style={{ 
                                          position: "relative",
                                          borderRadius: "8px",
                                          overflow: "hidden",
                                          aspectRatio: isVideo ? "16/9" : "1",
                                          minHeight: isVideo ? "180px" : undefined,
                                          border: "2px solid var(--color-border)",
                                          cursor: "pointer"
                                        }}
                                        onClick={() => !isVideo && window.open(normalizedUrl, '_blank')}
                                      >
                                        {isVideo ? (
                                          <>
                                            <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const wrap = (e.currentTarget as HTMLElement).closest("[data-video-wrap]");
                                                const video = wrap?.querySelector("video");
                                                if (video?.requestFullscreen) video.requestFullscreen();
                                              }}
                                              title={t("common.fullscreen") || "Plein écran"}
                                              style={{
                                                position: "absolute",
                                                bottom: "0.5rem",
                                                right: "0.5rem",
                                                width: "32px",
                                                height: "32px",
                                                background: "rgba(0,0,0,0.65)",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: "white",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                              }}
                                            >
                                              <Maximize2 size={16} strokeWidth={2} />
                                            </button>
                                          </>
                                        ) : (
                                          <img src={normalizedUrl} alt={`Media ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onClick={() => window.open(normalizedUrl, '_blank')} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              );
                            })()}

                            {/* Statistics Section for PUBLISHED - Multi-platform stats */}
                            {(() => {
                              // Récupérer les statistiques multi-plateformes depuis contentUploads[].platformStats
                              const allContentUploads = collab.contentUploads || [];
                              
                              // Collecter toutes les platformStats de tous les uploads
                              const allPlatformStats: Array<{
                                platform: string;
                                sentiment?: string;
                                publishedAt?: string;
                                postUrl?: string;
                                insights?: any;
                              }> = [];
                              
                              allContentUploads.forEach(upload => {
                                if (upload.platformStats && Array.isArray(upload.platformStats)) {
                                  upload.platformStats.forEach((stat: any) => {
                                    if (stat.insights && Object.keys(stat.insights).length > 0) {
                                      allPlatformStats.push(stat);
                                    }
                                  });
                                }
                              });
                              
                              if (allPlatformStats.length === 0) {
                                return null;
                              }
                              
                              return (
                                <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                                  <div style={{ 
                                    fontSize: "0.6875rem", 
                                    color: "var(--color-text-tertiary)", 
                                    fontWeight: "700", 
                                    textTransform: "uppercase", 
                                    marginBottom: "0.75rem" 
                                  }}>
                                    📊 Statistiques multi-plateformes
                                  </div>
                                  
                                  {allPlatformStats.map((stat, statIdx) => (
                                    <div key={statIdx} style={{ 
                                      marginBottom: "1rem",
                                      padding: "1rem",
                                      background: "var(--color-gray-50)",
                                      borderRadius: "8px",
                                      border: "1px solid var(--color-border)"
                                    }}>
                                      <div style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "0.5rem",
                                        marginBottom: "0.75rem"
                                      }}>
                                        <span style={{ 
                                          fontSize: "0.75rem", 
                                          fontWeight: "600", 
                                          textTransform: "capitalize",
                                          color: "var(--color-text-secondary)"
                                        }}>
                                          {stat.platform}
                                        </span>
                                        {stat.postUrl && (
                                          <a 
                                            href={stat.postUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.25rem",
                                              color: "#3b82f6",
                                              textDecoration: "none",
                                              fontSize: "0.75rem"
                                            }}
                                          >
                                            <ExternalLink size={12} />
                                            Voir la publication
                                          </a>
                                        )}
                                        {stat.sentiment && (
                                          <span style={{
                                            fontSize: "0.625rem",
                                            background: stat.sentiment === "positive" ? "#dcfce7" : stat.sentiment === "negative" ? "#fee2e2" : "#f3f4f6",
                                            color: stat.sentiment === "positive" ? "#047857" : stat.sentiment === "negative" ? "#b91c1c" : "#374151",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "4px",
                                            fontWeight: "600"
                                          }}>
                                            {stat.sentiment === "positive" ? "Positif" : stat.sentiment === "negative" ? "Négatif" : "Neutre"}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {stat.insights && (
                                        <div style={{ 
                                          display: "grid", 
                                          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
                                          gap: "0.75rem" 
                                        }}>
                                          {stat.insights.views !== undefined && (
                                            <div style={{ 
                                              padding: "0.75rem",
                                              background: "var(--color-white)",
                                              borderRadius: "6px",
                                              border: "1px solid var(--color-border)"
                                            }}>
                                              <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>VIEWS</div>
                                              <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.views.toLocaleString()}</div>
                                            </div>
                                          )}
                                          {stat.insights.saves !== undefined && (
                                            <div style={{ 
                                              padding: "0.75rem",
                                              background: "var(--color-white)",
                                              borderRadius: "6px",
                                              border: "1px solid var(--color-border)"
                                            }}>
                                              <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>SAVED</div>
                                              <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.saves.toLocaleString()}</div>
                                            </div>
                                          )}
                                          {stat.insights.likes !== undefined && (
                                            <div style={{ 
                                              padding: "0.75rem",
                                              background: "var(--color-white)",
                                              borderRadius: "6px",
                                              border: "1px solid var(--color-border)"
                                            }}>
                                              <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>LIKES</div>
                                              <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.likes.toLocaleString()}</div>
                                            </div>
                                          )}
                                          {stat.insights.comments !== undefined && (
                                            <div style={{ 
                                              padding: "0.75rem",
                                              background: "var(--color-white)",
                                              borderRadius: "6px",
                                              border: "1px solid var(--color-border)"
                                            }}>
                                              <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>COMMENTS</div>
                                              <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.comments.toLocaleString()}</div>
                                            </div>
                                          )}
                                          {stat.insights.shares !== undefined && (
                                            <div style={{ 
                                              padding: "0.75rem",
                                              background: "var(--color-white)",
                                              borderRadius: "6px",
                                              border: "1px solid var(--color-border)"
                                            }}>
                                              <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Partage</div>
                                              <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.shares.toLocaleString()}</div>
                                            </div>
                                          )}
                                          {stat.insights.engagement_rate !== undefined && (
                                            <div style={{ 
                                              padding: "0.75rem",
                                              background: "var(--color-white)",
                                              borderRadius: "6px",
                                              border: "1px solid var(--color-border)"
                                            }}>
                                              <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>RER%</div>
                                              <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.engagement_rate.toFixed(2)}%</div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {/* Bouton pour éditer les statistiques */}
                                  <div style={{ marginTop: "0.75rem" }}>
                                    <button
                                      onClick={() => {
                                        setMultiPlatformStatsContext({ collabId: collab._id, uploadIndex: 0 });
                                        const firstUpload = collab.contentUploads?.[0];
                                        const existingPlatformStats = firstUpload?.platformStats || [];
                                        setMultiPlatformStats(existingPlatformStats.length > 0 ? existingPlatformStats.map((stat: any) => ({
                                          platform: stat.platform || "",
                                          link: stat.postUrl || "",
                                          sentiment: stat.sentiment || "neutral",
                                          views: stat.insights?.views?.toString() || "",
                                          saved: stat.insights?.saves?.toString() || "",
                                          likes: stat.insights?.likes?.toString() || "",
                                          comments: stat.insights?.comments?.toString() || "",
                                          shares: stat.insights?.shares?.toString() || "",
                                          rer: stat.insights?.engagement_rate?.toString() || "",
                                          sponsored: stat.sponsored || false
                                        })) : [{
                                          platform: "",
                                          link: "",
                                          sentiment: "neutral",
                                          views: "",
                                          saved: "",
                                          likes: "",
                                          comments: "",
                                          shares: "",
                                          rer: "",
                                          sponsored: false
                                        }]);
                                      }}
                                      className="btn-meta btn-meta-secondary"
                                      style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
                                    >
                                      Modifier statistiques
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <>
                            {collab.description && (
                              <div style={{ 
                                marginBottom: "1rem",
                                padding: "0.75rem",
                                background: "var(--color-gray-50)",
                                borderLeft: "3px solid #6366f1",
                                borderRadius: "4px"
                              }}>
                                <div style={{ fontSize: "0.6875rem", color: "#6366f1", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                                  📝 {t('workflow.noteInterne')}
                                </div>
                                <div style={{ fontSize: "0.8125rem", color: "#666" }}>
                                  {getDisplayDescription(collab)}
                                </div>
                              </div>
                            )}

                            {(collab as WorkflowCollaboration).descriptionIt && (
                              <div style={{ 
                                marginBottom: "1rem",
                                padding: "0.75rem",
                                background: "var(--color-gray-50)",
                                borderLeft: "3px solid #6366f1",
                                borderRadius: "4px"
                              }}>
                                <div style={{ fontSize: "0.6875rem", color: "#6366f1", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                                  📝 {t('collaborations.descriptionItLabel') || 'Description (italien)'}
                                </div>
                                <div style={{ fontSize: "0.8125rem", color: "#666" }}>{(collab as WorkflowCollaboration).descriptionIt}</div>
                              </div>
                            )}

                            {collab.description && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                  {t('common.caption')}
                                </div>
                                <p style={{ fontSize: "0.9375rem", color: "#111", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                  {getDisplayDescription(collab)}
                                </p>
                              </div>
                            )}

                            {collab.hashtags && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.875rem", color: "#3b82f6", fontWeight: "500" }}>
                                  {collab.hashtags}
                                </div>
                              </div>
                            )}

                            {/* Media Section */}
                            <div style={{ marginBottom: "1rem" }}>
                              <div style={{ 
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.75rem"
                              }}>
                                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontWeight: "700", textTransform: "uppercase" }}>
                                  📷 {t('workflow.mediaCount')} ({getMediaCount(collab)})
                                </span>
                                {(userRole === 'graphiste' && (collab.status === 'PENDING_GRAPHIC' || collab.status === 'PENDING_CORRECTION')) || isAdmin || (userRole === 'influencer' && collab.status === 'DRAFT') ? (
                                  <>
                                  <label style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.375rem 0.75rem",
                                    background: isAdmin 
                                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                      : userRole === 'influencer'
                                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                      : collab.status === 'PENDING_CORRECTION'
                                      ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                                      : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                    color: "white",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    cursor: uploading[collab._id] ? "not-allowed" : "pointer"
                                  }}>
                                    <input 
                                      type="file" 
                                      multiple 
                                      accept="image/*,video/*"
                                      onChange={(e) => e.target.files && handleMediaUpload(collab._id, e.target.files)}
                                      disabled={uploading[collab._id]}
                                      style={{ display: "none" }}
                                    />
                                    <Upload size={12} strokeWidth={2} />
                                    {uploading[collab._id] ? t('workflow.uploading') : t('workflow.add')}
                                  </label>
                                  {uploading[collab._id] && uploadProgress[collab._id] && (
                                    <div style={{ marginTop: "6px", width: "100%", maxWidth: 200 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: 2 }}>
                                        <span>{uploadProgress[collab._id].currentFile ? `${uploadProgress[collab._id].currentFile.slice(0, 18)}${(uploadProgress[collab._id].currentFile?.length || 0) > 18 ? "…" : ""}` : ""}</span>
                                        {uploadProgress[collab._id].total && uploadProgress[collab._id].total > 1 && (
                                          <span>{uploadProgress[collab._id].current}/{uploadProgress[collab._id].total}</span>
                                        )}
                                      </div>
                                      <div style={{ height: 6, borderRadius: 3, background: "var(--color-border)", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${uploadProgress[collab._id].percent}%`, background: "var(--color-primary)", transition: "width 0.2s ease" }} />
                                      </div>
                                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{uploadProgress[collab._id].percent}%</div>
                                    </div>
                                  )}
                                  </>
                                ) : null}
                              </div>
                              
                              {(() => {
                                const mediaUrls = getAllMediaUrls(collab);
                                if (mediaUrls.length === 0) return null;
                                return (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                                    {mediaUrls.map((url, idx) => {
                                    const normalizedUrl = getMediaUrlForContext(url, "workflow");
                                    const isVideo = url.match(/\.mp4($|\?)/i);
                                    return (
                                      <div 
                                        key={idx} 
                                        data-video-wrap
                                        style={{ 
                                          position: "relative",
                                          borderRadius: "8px",
                                          overflow: "hidden",
                                          aspectRatio: isVideo ? "16/9" : "1",
                                          minHeight: isVideo ? "180px" : undefined,
                                          border: "2px solid var(--color-border)",
                                          cursor: "pointer"
                                        }}
                                        onClick={() => !isVideo && window.open(normalizedUrl, '_blank')}
                                      >
                                        {isVideo ? (
                                          <>
                                            <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const wrap = (e.currentTarget as HTMLElement).closest("[data-video-wrap]");
                                                const video = wrap?.querySelector("video");
                                                if (video?.requestFullscreen) video.requestFullscreen();
                                              }}
                                              title={t("common.fullscreen") || "Plein écran"}
                                              style={{
                                                position: "absolute",
                                                bottom: "0.5rem",
                                                right: "0.5rem",
                                                width: "32px",
                                                height: "32px",
                                                background: "rgba(0,0,0,0.65)",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: "white",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                              }}
                                            >
                                              <Maximize2 size={16} strokeWidth={2} />
                                            </button>
                                          </>
                                        ) : (
                                          <img src={normalizedUrl} alt={`Media ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onClick={() => window.open(normalizedUrl, '_blank')} />
                                        )}
                                        {(userRole === 'graphiste' && (collab.status === 'PENDING_GRAPHIC' || collab.status === 'PENDING_CORRECTION')) || isAdmin || (userRole === 'influencer' && collab.status === 'DRAFT') ? (
                                            <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveMedia(collab._id, idx); }}
                                            style={{
                                              position: "absolute",
                                              top: "0.25rem",
                                              right: "0.25rem",
                                              width: "20px",
                                              height: "20px",
                                              background: "rgba(0,0,0,0.7)",
                                              border: "none",
                                              borderRadius: "50%",
                                              color: "white",
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center"
                                            }}
                                          >
                                            <X size={10} strokeWidth={3} />
                                          </button>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                                );
                              })()}
                              {(() => {
                                const mediaUrls = getAllMediaUrls(collab);
                                if (mediaUrls.length > 0) return null;
                                if (!((userRole === 'graphiste' && (collab.status === 'PENDING_GRAPHIC' || collab.status === 'PENDING_CORRECTION')) || isAdmin || (userRole === 'influencer' && collab.status === 'DRAFT'))) return null;
                                return (
                                <label style={{
                                  display: "block",
                                  padding: "1.5rem",
                                  border: `2px dashed ${
                                    isAdmin ? '#667eea' : 
                                    userRole === 'influencer' ? '#10b981' :
                                    collab.status === 'PENDING_CORRECTION' ? '#f97316' : 
                                    '#8b5cf6'
                                  }`,
                                  borderRadius: "8px",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  background: isAdmin 
                                    ? "#667eea08" 
                                    : userRole === 'influencer'
                                    ? "#10b98108"
                                    : collab.status === 'PENDING_CORRECTION' 
                                    ? "#f9731608" 
                                    : "#8b5cf608"
                                }}>
                                  <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*,video/*"
                                    onChange={(e) => e.target.files && handleMediaUpload(collab._id, e.target.files)}
                                    style={{ display: "none" }}
                                  />
                                  <Upload size={28} strokeWidth={1.5} style={{ 
                                    opacity: 0.4, 
                                    margin: "0 auto 0.5rem", 
                                    color: isAdmin 
                                      ? "#667eea" 
                                      : userRole === 'influencer'
                                      ? "#10b981"
                                      : collab.status === 'PENDING_CORRECTION' 
                                      ? "#f97316" 
                                      : "#8b5cf6" 
                                  }} />
                                  <p style={{ 
                                    fontSize: "0.8125rem", 
                                    fontWeight: "600", 
                                    color: isAdmin 
                                      ? "#667eea" 
                                      : userRole === 'influencer'
                                      ? "#10b981"
                                      : collab.status === 'PENDING_CORRECTION' 
                                      ? "#f97316" 
                                      : "#8b5cf6" 
                                  }}>
                                    {t('workflow.uploadVisuals')}
                                  </p>
                                </label>
                                );
                              })()}
                            </div>

                            {/* Comments */}
                            {collab.comments && collab.comments.length > 0 && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                                  💬 {t('workflow.commentsCount')} ({collab.comments.length})
                                </div>
                                {collab.comments.map((comment: any, idx: number) => (
                                  <div key={idx} style={{ padding: "0.625rem 0.75rem", background: "var(--color-gray-50)", borderRadius: "6px", marginBottom: "0.5rem", border: "1px solid var(--color-border)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--color-text-primary)" }}>{comment.user}</span>
                                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>{new Date(comment.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            <CollabCommentInput />
                          </>
                        )}
                      </div>

                      {/* Actions Footer */}
                      <div style={{ 
                        padding: "1rem 1.5rem",
                        borderTop: "1px solid var(--color-border)",
                        background: "var(--color-bg-hover)",
                        display: "flex",
                        gap: "0.5rem",
                        justifyContent: "flex-end"
                      }}>
                        {/* Digital Marketer & Admin */}
                        {(userRole === 'digital' || isAdmin) && collab.status === 'DRAFT' && (
                          <>
                            {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Validate button clicked for admin');
                                  handleValidate(collab._id);
                                }}
                                className="btn-meta btn-meta-primary" 
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-success)", display: "flex", gap: "0.375rem", alignItems: "center", cursor: "pointer" }}
                                type="button"
                              >
                                <Check size={14} strokeWidth={2.5} /> {t('posts.validate')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditCollab(collab); }}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Edit size={14} /> {t('common.edit')}
                            </button>
                            <button 
                              onClick={() => handleDelete(collab._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                          </>
                        )}

                        {/* Admin - Actions sur tous les statuts (sauf DRAFT géré au-dessus, SCHEDULED déjà couvert, et PUBLISHED) */}
                        {isAdmin && collab.status !== 'DRAFT' && collab.status !== 'SCHEDULED' && collab.status !== 'PUBLISHED' && (
                          <>
                            {/* Admin peut aussi approuver/rejeter en révision */}
                            {collab.status === 'CLIENT_REVIEW' && (
                              <>
                                <button 
                                  onClick={async () => {
                                    const response = await fetch('/api/collaborations/workflow', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ collabId: collab._id, action: 'APPROVE_POST', comment: comments[collab._id] || t('posts.approved'), role: 'ADMIN' })
                                    });
                                    if (response.ok) {
                                      const data = await response.json();
                                      setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                      setComments({ ...comments, [collab._id]: '' });
                                      alert(t('workflow.approveSuccess'));
                                    }
                                  }}
                                  className="btn-meta btn-meta-primary" 
                                  style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-success)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                                >
                                  <CheckCircle size={14} strokeWidth={2.5} /> {t('posts.approve')}
                                </button>
                                <button 
                                  onClick={async () => {
                                    const response = await fetch('/api/collaborations/workflow', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ collabId: collab._id, action: 'REJECT_POST', comment: comments[collab._id] || t('workflow.rejectSuccess'), role: 'ADMIN' })
                                    });
                                    if (response.ok) {
                                      const data = await response.json();
                                      setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                      setComments({ ...comments, [collab._id]: '' });
                                      alert(t('workflow.rejectSuccess'));
                                    }
                                  }}
                                  className="btn-meta btn-meta-secondary" 
                                  style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                                >
                                  <XCircle size={14} /> {t('posts.reject')}
                                </button>
                              </>
                            )}
                            
                            {/* Admin peut soumettre les graphiques */}
                            {collab.status === 'PENDING_GRAPHIC' && (
                              <button 
                                onClick={async () => {
                                  const response = await fetch('/api/collaborations/workflow', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ collabId: collab._id, action: 'SUBMIT_GRAPHIC', comment: comments[collab._id] || t('workflow.submitGraphicSuccess'), role: 'ADMIN' })
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                    setComments({ ...comments, [collab._id]: '' });
                                    alert(t('workflow.submitGraphicSuccess'));
                                  }
                                }}
                                className="btn-meta btn-meta-primary" 
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#8b5cf6", display: "flex", gap: "0.375rem", alignItems: "center" }}
                              >
                                <Send size={14} strokeWidth={2.5} /> {t('workflow.submitToClient')}
                              </button>
                            )}
                            
                            {/* Admin peut resoumettre les corrections */}
                            {collab.status === 'PENDING_CORRECTION' && (
                              <button 
                                onClick={async () => {
                                  const response = await fetch('/api/collaborations/workflow', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ collabId: collab._id, action: 'RESUBMIT_CORRECTION', comment: comments[collab._id] || t('workflow.resubmitSuccess'), role: 'ADMIN' })
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                    setComments({ ...comments, [collab._id]: '' });
                                    alert(t('workflow.resubmitSuccess'));
                                  }
                                }}
                                className="btn-meta btn-meta-primary" 
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#f97316", display: "flex", gap: "0.375rem", alignItems: "center" }}
                              >
                                <Send size={14} strokeWidth={2.5} /> {t('workflow.resubmit')}
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditCollab(collab); }}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Edit size={14} /> {t('common.edit')}
                            </button>
                            <button 
                              onClick={() => handleDelete(collab._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                          </>
                        )}

                        {/* Client */}
                        {userRole === 'client' && collab.status === 'DRAFT' && (
                          <>
                            <button 
                              onClick={() => handleValidate(collab._id)}
                              className="btn-meta btn-meta-primary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-success)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Check size={14} strokeWidth={2.5} /> {t('posts.validate')}
                            </button>
                            <button 
                              onClick={() => handleDelete(collab._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                          </>
                        )}

                        {/* Client - Actions sur révision (Admin géré dans section Admin) */}
                        {userRole === 'client' && !isAdmin && collab.status === 'CLIENT_REVIEW' && (
                          <>
                            <button 
                              onClick={async () => {
                                const response = await fetch('/api/collaborations/workflow', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ collabId: collab._id, action: 'APPROVE_POST', comment: comments[collab._id] || t('posts.approved'), role: 'CLIENT' })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                  setComments({ ...comments, [collab._id]: '' });
                                  alert(t('workflow.approveSuccess'));
                                }
                              }}
                              className="btn-meta btn-meta-primary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-success)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <CheckCircle size={14} strokeWidth={2.5} /> {t('posts.approve')}
                            </button>
                            <button 
                              onClick={async () => {
                                const response = await fetch('/api/collaborations/workflow', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ collabId: collab._id, action: 'REJECT_POST', comment: comments[collab._id] || t('workflow.rejectSuccess'), role: 'CLIENT' })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                  setComments({ ...comments, [collab._id]: '' });
                                  alert(t('workflow.rejectSuccess'));
                                }
                              }}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <XCircle size={14} /> {t('posts.reject')}
                            </button>
                          </>
                        )}

                        {/* Graphiste/Vidéo Motion - Accès en lecture aux révisions */}
                        {userRole === 'graphiste' && collab.status === 'CLIENT_REVIEW' && (
                          <div style={{ 
                            padding: "0.75rem 1rem",
                            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                            border: "2px solid #f59e0b",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.8125rem",
                            fontWeight: "600",
                            color: "#92400e"
                          }}>
                            <Eye size={16} strokeWidth={2.5} />
                            {t('workflow.revisionInProgress')}
                          </div>
                        )}

                        {/* Graphiste - Actions (Admin géré dans section Admin) */}
                        {userRole === 'graphiste' && !isAdmin && collab.status === 'PENDING_GRAPHIC' && (
                          <button 
                            onClick={async () => {
                              const response = await fetch('/api/collaborations/workflow', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ collabId: collab._id, action: 'SUBMIT_GRAPHIC', comment: comments[collab._id] || t('workflow.submitGraphicSuccess'), role: 'GRAPHIC_DESIGNER' })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                setComments({ ...comments, [collab._id]: '' });
                                alert(t('workflow.submitGraphicSuccess'));
                              }
                            }}
                            className="btn-meta btn-meta-primary" 
                            style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#8b5cf6", display: "flex", gap: "0.375rem", alignItems: "center" }}
                          >
                            <Send size={14} strokeWidth={2.5} /> {t('workflow.submitToClient')}
                          </button>
                        )}

                        {userRole === 'graphiste' && !isAdmin && collab.status === 'PENDING_CORRECTION' && (
                          <button 
                            onClick={async () => {
                              const response = await fetch('/api/collaborations/workflow', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ collabId: collab._id, action: 'RESUBMIT_CORRECTION', comment: comments[collab._id] || t('workflow.resubmitSuccess'), role: 'GRAPHIC_DESIGNER' })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setCollaborations(collaborations.map(c => c._id === collab._id ? data.collaboration : c));
                                setComments({ ...comments, [collab._id]: '' });
                                alert(t('workflow.resubmitSuccess'));
                              }
                            }}
                            className="btn-meta btn-meta-primary" 
                            style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#f97316", display: "flex", gap: "0.375rem", alignItems: "center" }}
                          >
                            <Send size={14} strokeWidth={2.5} /> {t('workflow.resubmit')}
                          </button>
                        )}

                        {/* Digital Marketer & Client & Admin - Can modify and delete SCHEDULED posts */}
                        {(userRole === 'digital' || userRole === 'client' || isAdmin) && collab.status === 'SCHEDULED' && (
                          <>
                            <button
                              onClick={() => openStatsEditor(collab, "publish")}
                              className="btn-meta btn-meta-primary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-primary)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <CheckCircle size={14} strokeWidth={2.5} /> {t('workflow.markAsPublished')}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditCollab(collab); }}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Edit size={14} /> {t('common.edit')}
                            </button>
                            <button 
                              onClick={() => handleDelete(collab._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                          </>
                        )}

                        {/* Bouton Ajouter statistiques pour PUBLISHED */}
                        {(userRole === 'digital' || userRole === 'client' || isAdmin) && collab.status === 'PUBLISHED' && (
                          <button
                            onClick={() => {
                              setMultiPlatformStatsContext({ collabId: collab._id, uploadIndex: 0 });
                              // Charger les statistiques existantes depuis contentUploads[0].platformStats si elles existent
                              const firstUpload = collab.contentUploads?.[0];
                              const existingPlatformStats = firstUpload?.platformStats || [];
                              setMultiPlatformStats(existingPlatformStats.length > 0 ? existingPlatformStats.map((stat: any) => ({
                                platform: stat.platform || "",
                                link: stat.postUrl || "",
                                sentiment: stat.sentiment || "neutral",
                                views: stat.insights?.views?.toString() || "",
                                saved: stat.insights?.saves?.toString() || "",
                                likes: stat.insights?.likes?.toString() || "",
                                comments: stat.insights?.comments?.toString() || "",
                                shares: stat.insights?.shares?.toString() || "",
                                rer: stat.insights?.engagement_rate?.toString() || "",
                                sponsored: stat.sponsored || false
                              })) : [{
                                platform: "",
                                link: "",
                                sentiment: "neutral",
                                views: "",
                                saved: "",
                                likes: "",
                                comments: "",
                                shares: "",
                                rer: "",
                                sponsored: false
                              }]);
                            }}
                            className="btn-meta btn-meta-primary"
                            style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-primary)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                          >
                            <BarChart3 size={14} strokeWidth={2.5} /> Ajouter statistiques
                          </button>
                        )}

                        {/* Admin / droits : modifier ou supprimer une collaboration publiée */}
                        {(canUpdate("workflowCollab") || canDelete("workflowCollab")) && collab.status === 'PUBLISHED' && (
                          <>
                            {canUpdate("workflowCollab") && (
                              <button
                                type="button"
                                onClick={() => openEditCollab(collab)}
                                className="btn-meta btn-meta-secondary"
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}
                              >
                                <Edit size={14} /> {t('common.edit')}
                              </button>
                            )}
                            {canDelete("workflowCollab") && (
                              <button
                                type="button"
                                onClick={() => handleDelete(collab._id)}
                                className="btn-meta btn-meta-secondary"
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                              >
                                <Trash2 size={14} /> {t('common.delete')}
                              </button>
                            )}
                          </>
                        )}

                      </div>

                      {statsContext?.collabId === collab._id && (
                        <div
                          style={{
                            margin: "1rem 1.5rem 0 1.5rem",
                            padding: "1.25rem",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
                              {t('collab.statsTitle')}
                            </div>
                            <div style={{ fontSize: "0.8125rem", color: "#475569" }}>
                              {statsContext.mode === "publish" ? t('workflow.statsPublishIntro') : t('workflow.statsEditIntro')}
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                            <div>
                              <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                {t('collab.statsPlatform')}
                              </label>
                              <select
                                value={statsForm.platform}
                                onChange={(e) => handleStatsChange("platform", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5f5",
                                  fontSize: "0.8125rem"
                                }}
                              >
                                <option value="">{t('collab.statsPlatformPlaceholder')}</option>
                                {postPlatforms.map((platform) => (
                                  <option key={platform} value={platform}>
                                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                {t('collab.statsSentiment')}
                              </label>
                              <select
                                value={statsForm.sentiment}
                                onChange={(e) => handleStatsChange("sentiment", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5f5",
                                  fontSize: "0.8125rem"
                                }}
                              >
                                <option value="positive">{t('collab.sentiments.positive')}</option>
                                <option value="neutral">{t('collab.sentiments.neutral')}</option>
                                <option value="negative">{t('collab.sentiments.negative')}</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                {t('collab.statsPublishedAt')}
                              </label>
                              <input
                                type="datetime-local"
                                value={statsForm.publishedAt}
                                onChange={(e) => handleStatsChange("publishedAt", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5f5",
                                  fontSize: "0.8125rem"
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                {t('collab.statsPublicationUrl')}
                              </label>
                              <input
                                type="url"
                                value={statsForm.postUrl}
                                onChange={(e) => handleStatsChange("postUrl", e.target.value)}
                                placeholder={t('collab.statsPublicationUrlPlaceholder')}
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5f5",
                                  fontSize: "0.8125rem"
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                            {metricKeys.map((key) => (
                              <div key={key}>
                                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                  {metricsLabels[key]}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={statsForm[key as keyof typeof emptyStatsForm] as string}
                                  onChange={(e) => handleStatsChange(key, e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "0.5rem",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5f5",
                                    fontSize: "0.8125rem"
                                  }}
                                />
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                            <button
                              onClick={handleCloseStatsEditor}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.625rem 1.25rem" }}
                              disabled={savingStats}
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              onClick={handleSaveStats}
                              className="btn-meta btn-meta-primary"
                              style={{ padding: "0.625rem 1.25rem" }}
                              disabled={savingStats}
                            >
                              {savingStats ? t('common.saving') : t('collab.statsSave')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Formulaire statistiques multi-plateformes */}
                      {multiPlatformStatsContext?.collabId === collab._id && (
                        <div
                          style={{
                            margin: "1rem 1.5rem 0 1.5rem",
                            padding: "1.25rem",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
                                Ajouter statistiques multi-plateformes
                              </div>
                              <div style={{ fontSize: "0.8125rem", color: "#475569" }}>
                                Ajoutez les statistiques pour chaque plateforme
                              </div>
                            </div>
                            <button
                              onClick={handleAddPlatform}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Plus size={12} /> Ajouter plateforme
                            </button>
                          </div>

                          {multiPlatformStats.map((stat, index) => (
                            <div
                              key={index}
                              style={{
                                padding: "1rem",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>
                                  Plateforme {index + 1}
                                </div>
                                {multiPlatformStats.length > 1 && (
                                  <button
                                    onClick={() => handleRemovePlatform(index)}
                                    style={{
                                      padding: "0.25rem 0.5rem",
                                      background: "#fef2f2",
                                      color: "#ef4444",
                                      border: "1px solid #fecaca",
                                      borderRadius: "4px",
                                      fontSize: "0.75rem",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    Plateforme *
                                  </label>
                                  <select
                                    value={stat.platform}
                                    onChange={(e) => handleMultiStatsChange(index, "platform", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  >
                                    <option value="">Sélectionner...</option>
                                    {postPlatforms.map((platform) => (
                                      <option key={platform} value={platform}>
                                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    LINK
                                  </label>
                                  <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input
                                      type="url"
                                      value={stat.link}
                                      onChange={(e) => handleMultiStatsChange(index, "link", e.target.value)}
                                      placeholder="URL de la publication"
                                      style={{
                                        flex: 1,
                                        padding: "0.5rem",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5f5",
                                        fontSize: "0.8125rem"
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleFetchStatsFromUrl(index)}
                                      disabled={fetchingStats[index] || !stat.link || !stat.platform}
                                      className="btn-meta btn-meta-secondary"
                                      style={{
                                        padding: "0.5rem 0.75rem",
                                        fontSize: "0.75rem",
                                        whiteSpace: "nowrap",
                                        opacity: (!stat.link || !stat.platform) ? 0.5 : 1,
                                        cursor: (!stat.link || !stat.platform) ? "not-allowed" : "pointer"
                                      }}
                                    >
                                      {fetchingStats[index] ? "Récupération..." : "Récupérer"}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    Sentiment
                                  </label>
                                  <select
                                    value={stat.sentiment}
                                    onChange={(e) => handleMultiStatsChange(index, "sentiment", e.target.value as "positive" | "neutral" | "negative")}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  >
                                    <option value="positive">Positif</option>
                                    <option value="neutral">Neutre</option>
                                    <option value="negative">Négatif</option>
                                  </select>
                                </div>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    VIEWS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={stat.views}
                                    onChange={(e) => handleMultiStatsChange(index, "views", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    SAVED
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={stat.saved}
                                    onChange={(e) => handleMultiStatsChange(index, "saved", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    LIKES
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={stat.likes}
                                    onChange={(e) => handleMultiStatsChange(index, "likes", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    COMMENTS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={stat.comments}
                                    onChange={(e) => handleMultiStatsChange(index, "comments", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    Partage
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={stat.shares}
                                    onChange={(e) => handleMultiStatsChange(index, "shares", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                                    RER%
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={stat.rer}
                                    onChange={(e) => handleMultiStatsChange(index, "rer", e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5f5",
                                      fontSize: "0.8125rem"
                                    }}
                                  />
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                                  <input
                                    type="checkbox"
                                    checked={stat.sponsored}
                                    onChange={(e) => handleMultiStatsChange(index, "sponsored", e.target.checked)}
                                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                  />
                                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                                    Sponsored
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                            <button
                              onClick={handleCloseMultiStatsEditor}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.625rem 1.25rem" }}
                              disabled={savingMultiStats}
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleSaveMultiStats}
                              className="btn-meta btn-meta-primary"
                              style={{ padding: "0.625rem 1.25rem" }}
                              disabled={savingMultiStats}
                            >
                              {savingMultiStats ? "Enregistrement..." : "Enregistrer"}
                            </button>
                          </div>
                        </div>
                      )}
                </>
                )}
                </div>
              );
            })}
          </div>
            )}
          </>
        )}
      </div>
      </div>
      </section>

      {/* Create Collaboration Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "2rem"
        }}>
          <div className="card-meta" style={{
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            position: "relative"
          }}>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingCollabId(null);
              }}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                padding: "0.5rem",
                background: "#fee",
                color: "#e11d48",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem" }}>
              {editingCollabId ? `✏️ ${t('common.edit')} ${t('menu.collaborations') || 'Collaboration'}` : `✨ ${t('collaborations.newCollaboration') || 'Nouvelle Collaboration'}`}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Influencer */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('common.influencer') || 'Influenceur'} *
                </label>
                <select
                  value={newCollab.influencerId}
                  onChange={(e) => setNewCollab({ ...newCollab, influencerId: e.target.value })}
                  className="input-meta"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem"
                  }}
                >
                  <option value="">{t('collaborations.selectInfluencer') || 'Sélectionner un influenceur'}</option>
                  {[...influencers]
                    .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }))
                    .map(inf => (
                    <option key={inf._id} value={inf._id}>
                      {(inf.name || "").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('common.project') || 'Projet'} *
                </label>
                <select
                  value={newCollab.projectId}
                  onChange={(e) => setNewCollab({ ...newCollab, projectId: e.target.value })}
                  className="input-meta"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem"
                  }}
                >
                  <option value="">{t('posts.selectProject') || 'Sélectionner un projet'}</option>
                  {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de contenu */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.contentType') || 'Type de contenu'} *
                </label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="radio"
                      name="contentType"
                      checked={newCollab.contentType === "reel"}
                      onChange={() => setNewCollab({ ...newCollab, contentType: "reel" })}
                    />
                    🎬 {t('collaborations.contentTypeReel') || 'Reel'}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="radio"
                      name="contentType"
                      checked={newCollab.contentType === "story"}
                      onChange={() => setNewCollab({ ...newCollab, contentType: "story" })}
                    />
                    📱 {t('collaborations.contentTypeStory') || 'Story'}
                  </label>
                </div>
              </div>

              {/* Plateformes */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.platforms') || 'Plateformes'}
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {COLLAB_PLATFORMS.map(platform => (
                    <label
                      key={platform}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.375rem 0.75rem",
                        background: newCollab.platforms.includes(platform) ? "#e0e7ff" : "#f1f5f9",
                        border: `2px solid ${newCollab.platforms.includes(platform) ? "#6366f1" : "#e2e8f0"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: "600"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newCollab.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCollab({ ...newCollab, platforms: [...newCollab.platforms, platform] });
                          } else {
                            setNewCollab({ ...newCollab, platforms: newCollab.platforms.filter(p => p !== platform) });
                          }
                        }}
                      />
                      {platform === "instagram" ? "📷" : platform === "facebook" ? "📘" : platform === "tiktok" ? "🎵" : platform === "youtube" ? "▶️" : platform === "x" ? "🐦" : platform === "linkedin" ? "💼" : platform === "threads" ? "🧵" : "📱"} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description (français) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.descriptionFr') || 'Description (français)'} *
                </label>
                <textarea
                  value={newCollab.description}
                  onChange={(e) => setNewCollab({ ...newCollab, description: e.target.value })}
                  className="input-meta"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    minHeight: "100px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('collaborations.descriptionPlaceholder') || 'Description de la collaboration...'}
                />
              </div>

              {/* Description (italien) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.descriptionItLabel') || 'Description (italien)'}
                </label>
                <textarea
                  value={newCollab.descriptionIt}
                  onChange={(e) => setNewCollab({ ...newCollab, descriptionIt: e.target.value })}
                  className="input-meta"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('collaborations.descriptionItPlaceholder') || 'Descrizione in italiano (opzionale)...'}
                />
              </div>

              {/* Caption (français) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.captionFr') || 'Caption (français)'}
                </label>
                <textarea
                  value={newCollab.captionFr}
                  onChange={(e) => setNewCollab({ ...newCollab, captionFr: e.target.value })}
                  className="input-meta"
                  style={{ width: "100%", padding: "0.625rem", fontSize: "0.875rem", minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
                  placeholder={t('collaborations.captionFrPlaceholder') || 'Légende du contenu en français…'}
                />
              </div>

              {/* Caption (italien) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.captionIt') || 'Caption (italien)'}
                </label>
                <textarea
                  value={newCollab.captionIt}
                  onChange={(e) => setNewCollab({ ...newCollab, captionIt: e.target.value })}
                  className="input-meta"
                  style={{ width: "100%", padding: "0.625rem", fontSize: "0.875rem", minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
                  placeholder={t('collaborations.captionItPlaceholder') || 'Didascalia in italiano…'}
                />
              </div>

              {/* Budget – champ toujours affiché dans Nouvelle Collaboration */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.budget') || 'Budget'} (€) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCollab.budget}
                  onChange={(e) => setNewCollab({ ...newCollab, budget: e.target.value })}
                  className="input-meta"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem"
                  }}
                  placeholder="5000"
                />
              </div>

              {/* Dates début / fin */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem"
                  }}>
                    {t('reports.startDate') || 'Date de début'} *
                  </label>
                  <input
                    type="date"
                    value={newCollab.startDate}
                    onChange={(e) => setNewCollab({ ...newCollab, startDate: e.target.value })}
                    className="input-meta"
                    style={{ width: "100%", padding: "0.625rem", fontSize: "0.875rem" }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem"
                  }}>
                    {t('reports.endDate') || 'Date de fin'} *
                  </label>
                  <input
                    type="date"
                    value={newCollab.endDate}
                    onChange={(e) => setNewCollab({ ...newCollab, endDate: e.target.value })}
                    className="input-meta"
                    style={{ width: "100%", padding: "0.625rem", fontSize: "0.875rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Contenu (vidéos / images) – visible en édition */}
            {editingCollabId && editingContentUploads !== null && (
              <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem"
                }}>
                  📷 {t('workflow.mediaCount') || 'Contenu'} (vidéos / images)
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {editingContentUploads.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
                      {t('workflow.noMediaYet') || 'Aucun contenu pour le moment.'}
                    </p>
                  ) : (
                    editingContentUploads.map((upload, uploadIndex) => (
                    <div
                      key={uploadIndex}
                      style={{
                        padding: "1rem",
                        background: "var(--color-bg-secondary)",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)"
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                        {t('workflow.mediaCount')} #{uploadIndex + 1}
                        {upload.description ? ` – ${upload.description.slice(0, 30)}${upload.description.length > 30 ? "…" : ""}` : ""}
                      </div>
                      <input
                        type="text"
                        value={upload.description || ""}
                        onChange={(e) => {
                          setEditingContentUploads(prev => !prev ? prev : prev.map((u, i) => i === uploadIndex ? { ...u, description: e.target.value } : u));
                        }}
                        placeholder={t('common.description') || "Description du contenu"}
                        className="input-meta"
                        style={{ width: "100%", marginBottom: "0.75rem", padding: "0.5rem", fontSize: "0.8125rem" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {(upload.urls || []).map((url, urlIndex) => (
                          <div
                            key={urlIndex}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              background: "var(--color-bg-primary)",
                              borderRadius: "6px",
                              border: "1px solid var(--color-border)"
                            }}
                          >
                            {/\.(mp4|mov|webm|ogg|mkv)$/i.test(url) ? (
                              <Video size={18} style={{ flexShrink: 0, color: "var(--color-primary)" }} />
                            ) : (
                              <ImageIcon size={18} style={{ flexShrink: 0, color: "var(--color-primary)" }} />
                            )}
                            <a href={getMediaUrlForContext(url, "workflow")} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {url.split("/").pop() || url}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingContentUploads(prev => {
                                  if (!prev) return prev;
                                  const next = prev.map((u, i) => {
                                    if (i !== uploadIndex) return u;
                                    const newUrls = (u.urls || []).filter((_, j) => j !== urlIndex);
                                    return { ...u, urls: newUrls };
                                  });
                                  return next;
                                });
                              }}
                              style={{ padding: "0.25rem", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "4px", cursor: "pointer" }}
                              title={t('common.remove') || 'Retirer'}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                          <input
                            type="url"
                            id={`add-url-${uploadIndex}`}
                            placeholder={t('workflow.addUrlPlaceholder') || "https://… ou /api/uploads/…"}
                            className="input-meta"
                            style={{ flex: 1, padding: "0.5rem", fontSize: "0.8125rem" }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const v = input.value.trim();
                                if (v) {
                                  setEditingContentUploads(prev => {
                                    if (!prev) return prev;
                                    return prev.map((u, i) => i === uploadIndex ? { ...u, urls: [...(u.urls || []), v] } : u);
                                  });
                                  input.value = "";
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(`add-url-${uploadIndex}`) as HTMLInputElement;
                              const v = input?.value?.trim();
                              if (v) {
                                setEditingContentUploads(prev => {
                                  if (!prev) return prev;
                                  return prev.map((u, i) => i === uploadIndex ? { ...u, urls: [...(u.urls || []), v] } : u);
                                });
                                if (input) input.value = "";
                              }
                            }}
                            className="btn-meta btn-meta-secondary"
                            style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
                          >
                            <Plus size={14} /> {t('workflow.add') || 'Ajouter'}
                          </button>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingContentUploads(prev => [
                      ...(prev || []),
                      { uploadedBy: user ? `${user.firstName} ${user.lastName}`.trim() : "User", role: "DIGITAL_MARKETER", urls: [], description: "", uploadedAt: new Date().toISOString(), validatedByClient: false }
                    ]);
                  }}
                  className="btn-meta btn-meta-secondary"
                  style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
                >
                  <Plus size={14} /> {t('workflow.addMediaBatch') || 'Ajouter un lot de médias'}
                </button>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCollabId(null);
                  setEditingContentUploads(null);
                }}
                className="btn-meta btn-meta-secondary"
                style={{ flex: 1 }}
              >
                {t('common.cancel') || 'Annuler'}
              </button>
              <button
                onClick={handleCreateCollaboration}
                className="btn-meta btn-meta-primary"
                style={{ flex: 1 }}
                disabled={!newCollab.influencerId || !newCollab.projectId || !newCollab.description || !newCollab.budget || !newCollab.startDate || !newCollab.endDate}
              >
                {editingCollabId ? (t('common.save') || t('common.edit')) : (t('common.create') || 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
