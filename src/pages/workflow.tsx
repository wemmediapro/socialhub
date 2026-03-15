import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getMediaUrlForContext } from "@/lib/utils";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import { getDisplayCaptionPost, getDisplayDescriptionPost, useTranslatePostDescriptionsWhenIt } from "@/lib/i18n-content";
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
  Download,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Plus,
  BarChart3,
  Maximize2
} from "lucide-react";

type WorkflowPost = {
  _id: string;
  projectId: string;
  projectIds?: string[];
  network?: "facebook" | "instagram" | "tiktok" | "threads";
  networks?: Array<"facebook" | "instagram" | "tiktok" | "threads">;
  type: string;
  description?: string;
  caption?: string;
  captionIt?: string;
  descriptionIt?: string;
  hashtags?: string;
  mediaUrls: string[];
  status: string;
  scheduledAt: string;
  assignedTo?: string;
  comments?: any[];
  insights?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagement_rate?: number;
  };
  sentiment?: "positive" | "neutral" | "negative";
  publishedAt?: string;
  postUrl?: string;
  statsPlatform?: "facebook" | "instagram" | "tiktok" | "threads";
  history?: Array<{ at: string; action: string; by: string; note: string }>;
  createdAt: string;
  updatedAt: string;
  project?: { _id: string; name: string } | null;
  projects?: Array<{ _id: string; name: string }>;
};

export default function WorkflowPage() {
  const { user, canCreate, canUpdate, canDelete, canWorkflow } = useAuth();
  const { t, language } = useTranslation();
  const [posts, setPosts] = useState<WorkflowPost[]>([]);
  useTranslatePostDescriptionsWhenIt(language, posts, setPosts);
  const [filter, setFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortByDate, setSortByDate] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, { percent: number; currentFile?: string; current?: number; total?: number }>>({});
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPostInCalendar, setSelectedPostInCalendar] = useState<WorkflowPost | null>(null);
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
  const [statsContext, setStatsContext] = useState<{ postId: string; mode: "publish" | "edit" } | null>(null);
  const postPlatforms: Array<"facebook" | "instagram" | "tiktok" | "threads"> = ["facebook", "instagram", "tiktok", "threads"];
  const emptyStatsForm = {
    platform: "" as "" | "facebook" | "instagram" | "tiktok" | "threads",
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
  const [multiPlatformStatsContext, setMultiPlatformStatsContext] = useState<{ postId: string } | null>(null);
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

  const openStatsEditor = (post: WorkflowPost, mode: "publish" | "edit") => {
    const defaultPlatform = post.statsPlatform || post.networks?.[0] || post.network || "";
    const defaultSentiment = post.sentiment || "neutral";
    const defaultPublishedAt =
      mode === "publish"
        ? formatDateTimeLocal(new Date().toISOString())
        : formatDateTimeLocal(post.publishedAt);

    setStatsForm({
      platform: defaultPlatform,
      sentiment: defaultSentiment,
      publishedAt: defaultPublishedAt,
      postUrl: post.postUrl || "",
      views: post.insights?.views?.toString() || "",
      likes: post.insights?.likes?.toString() || "",
      comments: post.insights?.comments?.toString() || "",
      shares: post.insights?.shares?.toString() || "",
      saves: post.insights?.saves?.toString() || "",
      engagement_rate: post.insights?.engagement_rate?.toString() || ""
    });
    setStatsContext({ postId: post._id, mode });
  };

  const handleStatsChange = (field: keyof typeof emptyStatsForm, value: string) => {
    setStatsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCloseStatsEditor = () => {
    resetStatsForm();
  };

  const handleSaveStats = async () => {
    if (!statsContext) return;
    const targetPost = posts.find(p => p._id === statsContext.postId);
    if (!targetPost) return;

    setSavingStats(true);
    try {
      const payload: any = {};

      const trimmedUrl = (statsForm.postUrl || "").trim();
      if (trimmedUrl) {
        payload.postUrl = trimmedUrl;
      } else if (targetPost.postUrl) {
        payload.postUrl = "";
      }

      if (statsForm.platform) {
        payload.statsPlatform = statsForm.platform;
      }

      payload.sentiment = statsForm.sentiment || "neutral";

      if (statsForm.publishedAt) {
        const dateValue = new Date(statsForm.publishedAt);
        if (!Number.isNaN(dateValue.getTime())) {
          payload.publishedAt = dateValue.toISOString();
        }
      } else if (statsContext.mode === "publish") {
        payload.publishedAt = new Date().toISOString();
      }

      const currentInsights: any = { ...(targetPost.insights || {}) };
      metricKeys.forEach((key) => {
        const raw = statsForm[key];
        if (!raw) {
          delete currentInsights[key];
        } else {
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) {
            currentInsights[key] = parsed;
          }
        }
      });

      if (Object.keys(currentInsights).length > 0) {
        payload.insights = currentInsights;
      } else if (targetPost.insights) {
        payload.insights = {};
      }

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
      payload.history = [...(targetPost.history || []), historyEntry];

      console.log("Saving stats payload for post:", JSON.stringify(payload, null, 2));
      
      const response = await fetch(`/api/posts/${targetPost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log("API response for post:", JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save stats");
      }

      // Recharger toutes les collaborations depuis l'API pour s'assurer d'avoir les dernières données
      const allPostsResponse = await fetch("/api/posts");
      const allPostsData = await allPostsResponse.json();
      
      if (allPostsData.posts) {
        setPosts(allPostsData.posts);
      } else {
        // Fallback : mettre à jour seulement le post modifié
        setPosts(posts.map(p => p._id === targetPost._id ? data.post : p));
      }
      
      alert(statsContext.mode === "publish" ? t('workflow.statsPublishSuccess') : t('workflow.statsSaveSuccess'));
      resetStatsForm();
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
    const targetPost = posts.find(p => p._id === multiPlatformStatsContext.postId);
    if (!targetPost) return;

    setSavingMultiStats(true);
    try {
      // Valider que toutes les plateformes ont au moins une plateforme sélectionnée
      const validStats = multiPlatformStats.filter(stat => stat.platform);
      if (validStats.length === 0) {
        alert("Veuillez ajouter au moins une plateforme avec des statistiques");
        return;
      }

      // Convertir les statistiques au format attendu
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
          publishedAt: new Date().toISOString(),
          insights: Object.keys(insights).length > 0 ? insights : undefined,
          sponsored: stat.sponsored || false
        };
      });
      
      console.log("=== SAVING MULTI-PLATFORM STATS FOR POST ===");
      console.log("Post ID:", targetPost._id);
      console.log("Formatted stats:", JSON.stringify(formattedStats, null, 2));

      const payload: any = {
        multiPlatformStats: formattedStats
      };

      const userName = user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur";
      const historyEntry = {
        at: new Date().toISOString(),
        action: "update_multi_platform_stats",
        by: userName || "Utilisateur",
        note: "Statistiques multi-plateformes mises à jour"
      };
      payload.history = [...(targetPost.history || []), historyEntry];

      const response = await fetch(`/api/posts/${targetPost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save multi-platform stats");
      }

      // Recharger toutes les collaborations depuis l'API pour s'assurer d'avoir les dernières données
      const allPostsResponse = await fetch("/api/posts");
      const allPostsData = await allPostsResponse.json();
      
      if (allPostsData.posts) {
        setPosts(allPostsData.posts);
      } else {
        setPosts(posts.map(p => p._id === targetPost._id ? data.post : p));
      }
      
      alert("Statistiques multi-plateformes enregistrées avec succès !");
      setMultiPlatformStatsContext(null);
      setMultiPlatformStats([]);
    } catch (error: any) {
      console.error("Error saving multi-platform stats:", error);
      alert("Erreur lors de l'enregistrement des statistiques");
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
      const response = await fetch('/api/posts/fetch-stats', {
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
  
  // Pour l'admin : état local pour le filtre de rôle (peut être modifié)
  // Pour les autres : rôle fixe basé sur l'utilisateur connecté
  const [roleFilter, setRoleFilter] = useState<"digital" | "graphiste" | "video_motion" | "client" | "all">("all");
  
  // Déterminer le rôle pour le workflow (format simplifié)
  const userRole: "digital" | "graphiste" | "client" = isGraphiste 
    ? "graphiste" 
    : isClient 
    ? "client" 
    : "digital";

  // Mapper le rôle de l'utilisateur vers assignedTo
  const getUserAssignedTo = (): string | null => {
    if (user?.role === 'infographiste') return 'infographiste';
    if (user?.role === 'video_motion') return 'video_motion';
    return null;
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(t('workflow.deleteConfirm'))) return;
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts(posts.filter(p => p._id !== postId));
      alert(t('workflow.deleteSuccess'));
    } catch (error) {
      alert(t('workflow.deleteError'));
    }
  };

  const handleValidate = async (postId: string) => {
    try {
      console.log('=== VALIDATION START ===');
      console.log('Post ID:', postId);
      console.log('User is admin:', isAdmin);
      console.log('User role:', userRole);
      console.log('User object:', user);
      
      const requestBody = {
        postId,
        action: 'VALIDATE_DRAFT',
        comment: comments[postId] || t('workflow.draftValidated'),
        role: isAdmin ? 'ADMIN' : userRole === 'digital' ? 'DIGITAL_MARKETER' : userRole === 'client' ? 'CLIENT' : 'GRAPHIC_DESIGNER'
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/posts/workflow', {
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
        const updatedPosts = posts.map(p => p._id === postId ? data.post : p);
        console.log('Updated posts:', updatedPosts);
        setPosts(updatedPosts);
        setComments({ ...comments, [postId]: '' });
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

  const handleAddComment = async (postId: string) => {
    if (!comments[postId]?.trim()) {
      alert(t('workflow.commentRequired'));
      return;
    }
    try {
      const post = posts.find(p => p._id === postId);
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
          text: comments[postId],
          createdAt: new Date().toISOString()
        }
      ];
      await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: updatedComments } : p));
      setComments({ ...comments, [postId]: '' });
    } catch (error) {
      alert(t('workflow.commentError'));
    }
  };

  const handleMediaUpload = async (postId: string, files: FileList) => {
    if (!files || !files.length) return;
    setUploading({ ...uploading, [postId]: true });
    const total = files.length;
    setUploadProgress({ ...uploadProgress, [postId]: { percent: 0, current: 0, total, currentFile: files[0]?.name } });
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(prev => ({ ...prev, [postId]: { ...prev[postId], current: i + 1, total, currentFile: files[i].name, percent: 0 } }));
        try {
          const url = await uploadFileWithProgress(files[i], (percent) => {
            setUploadProgress(prev => ({ ...prev, [postId]: { ...prev[postId], percent, currentFile: files[i].name, current: i + 1, total } }));
          });
          urls.push(url);
        } catch (error) {
          console.error("Upload error:", error);
          const msg = error instanceof Error ? error.message : String(error);
          alert(`${t('workflow.uploadError')}: ${files[i].name}\n\n${msg}`);
        }
      }
      
        if (urls.length > 0) {
      const post = posts.find(p => p._id === postId);
      if (!post) return;
      const updatedMediaUrls = [...(post.mediaUrls || []), ...urls];
      await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrls: updatedMediaUrls })
      });
      setPosts(posts.map(p => p._id === postId ? { ...p, mediaUrls: updatedMediaUrls } : p));
          alert(`${urls.length} ${t('workflow.uploadSuccess')}`);
        }
    } catch (error) {
        console.error("Error in handleMediaUpload:", error);
        alert(t('workflow.uploadError'));
    } finally {
      setUploading({ ...uploading, [postId]: false });
      setUploadProgress(prev => { const next = { ...prev }; delete next[postId]; return next; });
    }
  };

  const handleRemoveMedia = async (postId: string, mediaIndex: number) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    const updatedMediaUrls = post.mediaUrls.filter((_, i) => i !== mediaIndex);
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrls: updatedMediaUrls })
      });
      setPosts(posts.map(p => p._id === postId ? { ...p, mediaUrls: updatedMediaUrls } : p));
      alert(t('workflow.mediaRemoved'));
    } catch (error) {
      alert(t('workflow.mediaRemoveError'));
    }
  };

  const handleDownloadMediaHD = async (post: WorkflowPost) => {
    const urls = post.mediaUrls || [];
    if (urls.length === 0) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const hdUrl = getMediaUrlForContext(url, "library");
      const absoluteUrl = hdUrl.startsWith("http") ? hdUrl : `${base}${hdUrl}`;
      const filename = (url.split("/").pop() || `media-${i + 1}`).split("?")[0] || `media-${i + 1}.bin`;
      try {
        const res = await fetch(absoluteUrl, { mode: "cors" });
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        window.open(absoluteUrl, "_blank");
      }
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 400));
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/posts").then(r => r.json()),
      fetch("/api/projects").then(r => r.json())
    ])
      .then(([postsData, projectsData]) => {
        setPosts(postsData.posts || []);
        setProjects(projectsData.projects || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const getProjectNames = (post: WorkflowPost) => {
    // Si projectIds existe et n'est pas vide, utiliser projectIds
    // Sinon, utiliser projectId pour la compatibilité avec les anciens posts
    const projectIdsToShow = (post.projectIds && post.projectIds.length > 0) 
      ? post.projectIds 
      : [post.projectId];
    
    return projectIdsToShow.map(id => getProjectName(id));
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

  // Filtrer les posts selon le rôle de l'utilisateur (pour les statistiques)
  const postsForStats = posts.filter(p => {
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
        const isAssignedToUser = p.assignedTo === assignedTo || 
               (assignedTo === 'infographiste' && (p.assignedTo === 'infographiste' || p.assignedTo === 'GRAPHIC_DESIGNER')) ||
               (assignedTo === 'video_motion' && p.assignedTo === 'video_motion');
        
        // Voir tous les posts en révision (CLIENT_REVIEW) pour que les graphistes puissent suivre les retours client
        const isInReview = p.status === 'CLIENT_REVIEW';
        
        // Voir les posts en correction qui lui sont assignés
        const isInCorrection = p.status === 'PENDING_CORRECTION' && (p.assignedTo === assignedTo || p.assignedTo === 'GRAPHIC_DESIGNER');
        
        return isAssignedToUser || isInReview || isInCorrection;
      }
    }
    // Pour les autres rôles (client, digital), afficher tous les posts
    return true;
  });

  const postsByStatus = postsForStats.reduce((acc: any, post) => {
    acc[post.status] = (acc[post.status] || 0) + 1;
    return acc;
  }, {});

  // Filtrer les posts selon le rôle de l'utilisateur
  const filteredPosts = posts
    .filter(p => {
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
          const isAssignedToUser = p.assignedTo === assignedTo || 
                 (assignedTo === 'infographiste' && (p.assignedTo === 'infographiste' || p.assignedTo === 'GRAPHIC_DESIGNER')) ||
                 (assignedTo === 'video_motion' && p.assignedTo === 'video_motion');
          
          // Voir tous les posts en révision (CLIENT_REVIEW) pour que les graphistes puissent suivre les retours client
          const isInReview = p.status === 'CLIENT_REVIEW';
          
          // Voir les posts en correction qui lui sont assignés
          const isInCorrection = p.status === 'PENDING_CORRECTION' && (p.assignedTo === assignedTo || p.assignedTo === 'GRAPHIC_DESIGNER');
          
          return isAssignedToUser || isInReview || isInCorrection;
        }
      }
      // Pour les autres rôles (client, digital), afficher tous les posts
      return true;
    })
    .filter(p => filter === "all" || p.status === filter)
    .filter(p => {
      if (projectFilter === "all") return true;
      
      // Vérifier si le post est associé au projet filtré
      const projectIdsToCheck = (p.projectIds && p.projectIds.length > 0) 
        ? p.projectIds 
        : [p.projectId];
      
      return projectIdsToCheck.includes(projectFilter);
    })
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      return sortByDate === "asc" ? dateA - dateB : dateB - dateA;
    });

  const toggleExpand = async (postId: string) => {
    const willExpand = !expandedPosts[postId];
    if (willExpand) {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (data.post) {
          setPosts((prev) => prev.map((p) => (p._id === postId ? { ...data.post, project: p.project, projects: p.projects } : p)));
        }
      } catch (_) {}
    }
    setExpandedPosts({ ...expandedPosts, [postId]: willExpand });
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

  const getPostsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    return filteredPosts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      const matchesDate = postDate.getDate() === day && 
                           postDate.getMonth() === month && 
                           postDate.getFullYear() === year;
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
  const dayNames = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isCurrentMonth = () => {
    const today = new Date();
    const { year, month } = getDaysInMonth(currentDate);
    return today.getFullYear() === year && today.getMonth() === month;
  };

  return (
    <div className="page-content">
      <div className="dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: t('workflow.title') }
                ]} />
              </div>
              <h1 className="page-hero-title">{t('workflow.title')}</h1>
              <p className="page-hero-subtitle">{t('workflow.subtitle')}</p>
            </div>
            <div className="page-hero-actions">
              {isDigital && canCreate("workflowPosts") && (
                <Link href="/posts/new" className="page-hero-btn">
                  <Plus size={18} strokeWidth={2.5} />
                  {t('posts.create')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards - KPIs cliquables */}
        <div className="workflow-status-cards">
          {Object.keys(statusConfig)
            .sort((a, b) => statusConfig[a].order - statusConfig[b].order)
            .map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const count = postsByStatus[status] || 0;
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
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dash-filter-group">
                <label className="dash-filter-label">{t('workflow.sortByDate')}</label>
                <select
                  value={sortByDate}
                  onChange={(e) => setSortByDate(e.target.value as "asc" | "desc")}
                  className="dash-filter-select"
                  style={{ minWidth: "180px" }}
                >
                  <option value="asc">{t('workflow.sortDateOldest')}</option>
                  <option value="desc">{t('workflow.sortDateNewest')}</option>
                </select>
              </div>
              {!isAdmin && isGraphiste && (
                <div className="workflow-role-badge">
                  {getUserAssignedTo() === "infographiste"
                    ? "🎨 Infographiste"
                    : getUserAssignedTo() === "video_motion"
                    ? "🎬 Video Motion"
                    : "🎯 Graphiste"}
                </div>
              )}
            </div>
            <div className="dash-calendar-body">
        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="workflow-content-card">
            {/* Calendar Header */}
            <div className="workflow-calendar-nav">
              <div className="workflow-calendar-nav-actions">
                <button
                  onClick={prevMonth}
                  className="workflow-calendar-nav-btn"
                  type="button"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft size={18} />
                  Précédent
                </button>
                <button
                  onClick={nextMonth}
                  className="workflow-calendar-nav-btn"
                  type="button"
                  aria-label="Mois suivant"
                >
                  Suivant
                  <ChevronRight size={18} />
                </button>
              </div>
              <h2>
                {monthNames[getDaysInMonth(currentDate).month]} {getDaysInMonth(currentDate).year}
              </h2>
              <div className="workflow-calendar-nav-actions">
                <button
                  onClick={goToToday}
                  className={`workflow-calendar-nav-btn workflow-calendar-nav-btn--today`}
                  type="button"
                  aria-label="Revenir à aujourd'hui"
                >
                  <Calendar size={16} />
                  Aujourd&apos;hui
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="workflow-calendar-weekdays">
              {dayNames.map(day => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="workflow-calendar-grid">
              {Array.from({ length: getDaysInMonth(currentDate).startingDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="workflow-calendar-day-cell workflow-calendar-day-cell--empty" aria-hidden="true" />
              ))}
              {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayPosts = getPostsForDay(day);
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
                      {dayPosts.slice(0, 3).map(post => {
                        const statusInfo = statusConfig[post.status] || statusConfig.DRAFT;
                        const networks = post.networks || [post.network];
                        const title = getDisplayCaptionPost(post, language) || getDisplayDescriptionPost(post, language) || "Post";
                        const shortTitle = title.length > 18 ? title.substring(0, 18) + "…" : title;
                        return (
                          <div
                            key={post._id}
                            className="workflow-calendar-day-event"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPostInCalendar(post);
                            }}
                            style={{ background: statusInfo.color }}
                            title={getDisplayCaptionPost(post, language) || getDisplayDescriptionPost(post, language) || "Post sans titre"}
                          >
                            {networks[0] && (
                              <span style={{ marginRight: "var(--spacing-1)" }}>
                                {networks[0] === "instagram" ? "📷" : networks[0] === "facebook" ? "📘" : networks[0] === "tiktok" ? "🎵" : "🧵"}
                              </span>
                            )}
                            {shortTitle}
                          </div>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <div className="workflow-calendar-day-more">
                          +{dayPosts.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal détails post depuis calendrier */}
        {selectedPostInCalendar && viewMode === "calendar" && (
          <div
            className="workflow-modal-overlay"
            onClick={() => setSelectedPostInCalendar(null)}
          >
            <div
              className="workflow-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="workflow-modal-header">
                <h2 className="workflow-modal-title">
                  Détails du post
                </h2>
                <button
                  type="button"
                  className="workflow-modal-close"
                  onClick={() => setSelectedPostInCalendar(null)}
                >
                  <X size={24} color="var(--color-text-secondary)" />
                </button>
              </div>

              {/* Contenu du post */}
              {(() => {
                const post = selectedPostInCalendar;
                const statusInfo = statusConfig[post.status] || statusConfig.DRAFT;
                const StatusIcon = statusInfo.icon;
                const networks = post.networks || [post.network];
                const getProjectNames = (p: WorkflowPost) => {
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
                  <div>
                    {/* Badges */}
                    <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap", marginBottom: "var(--spacing-4)" }}>
                      <span style={{
                        background: statusInfo.color,
                        color: "white",
                        padding: "var(--spacing-1) var(--spacing-3)",
                        borderRadius: "var(--border-radius-base)",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-semibold)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-2)"
                      }}>
                          <StatusIcon size={14} />
                          {statusInfo.label}
                        </span>
                      {networks.map((network, idx) => {
                        const networkConfig: any = {
                          instagram: { color: "#e4405f", Icon: Instagram, name: "Instagram" },
                          facebook: { color: "#1877f2", Icon: Facebook, name: "Facebook" },
                          tiktok: { color: "#000000", Icon: Music, name: "TikTok" },
                          threads: { color: "#101010", Icon: MessageSquare, name: "Threads" }
                        };
                        const config = networkConfig[network];
                        const NetworkIcon = config?.Icon;
                        return (
                          <span 
                            key={idx}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "var(--spacing-1)",
                              background: "var(--color-white)",
                              padding: "var(--spacing-1) var(--spacing-3)",
                              borderRadius: "var(--border-radius-base)",
                              border: `1.5px solid ${config?.color || "#666"}`,
                              fontSize: "var(--font-size-xs)",
                              fontWeight: "var(--font-weight-semibold)",
                              color: config?.color || "#666"
                            }}
                          >
                            {NetworkIcon && <NetworkIcon size={14} />}
                            {config?.name || network}
                          </span>
                        );
                      })}
                      {getProjectNames(post).map((projectName, idx) => (
                        <span 
                          key={idx}
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "#6366f1",
                            background: "var(--color-white)",
                            padding: "var(--spacing-1) var(--spacing-3)",
                            borderRadius: "var(--border-radius-base)",
                            border: "1.5px solid #6366f1",
                            fontWeight: "var(--font-weight-semibold)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--spacing-1)"
                          }}
                        >
                          <Briefcase size={12} />
                          {projectName}
                        </span>
                      ))}
                    </div>

                    {/* Caption */}
                    {getDisplayCaptionPost(post, language) && (
                      <div style={{ marginBottom: "var(--spacing-4)" }}>
                        <div style={{ 
                          fontSize: "var(--font-size-xs)", 
                          color: "var(--color-text-secondary)", 
                          fontWeight: "var(--font-weight-semibold)", 
                          textTransform: "uppercase",
                          marginBottom: "var(--spacing-2)"
                        }}>
                          Caption
                        </div>
                        <p style={{ 
                          fontSize: "var(--font-size-base)", 
                          color: "var(--color-text-primary)", 
                          lineHeight: "var(--line-height-relaxed)",
                          whiteSpace: "pre-wrap"
                        }}>
                          {getDisplayCaptionPost(post, language)}
                        </p>
                      </div>
                    )}

                    {/* Médias */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div style={{ marginBottom: "var(--spacing-4)" }}>
                        <div style={{ 
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--spacing-2)"
                        }}>
                          <div style={{ 
                            fontSize: "var(--font-size-xs)", 
                            color: "var(--color-text-secondary)", 
                            fontWeight: "var(--font-weight-semibold)", 
                            textTransform: "uppercase"
                          }}>
                            Médias ({post.mediaUrls.length})
                          </div>
                          {post.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDownloadMediaHD(post); }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                padding: "0.375rem 0.75rem",
                                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: "pointer"
                              }}
                            >
                              <Download size={12} strokeWidth={2} />
                              {t('workflow.downloadMediaHD')}
                            </button>
                          )}
                        </div>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
                          gap: "var(--spacing-2)"
                        }}>
                          {post.mediaUrls.map((url, idx) => {
                            const normalizedUrl = getMediaUrlForContext(url, "workflow");
                            const isVideo = url.match(/\.mp4($|\?)/i);
                            return (
                              <div 
                                key={idx}
                                onClick={() => window.open(normalizedUrl, '_blank')}
                                style={{
                                  aspectRatio: "1",
                                  borderRadius: "var(--border-radius-base)",
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  border: "2px solid var(--color-border)"
                                }}
                              >
                                {isVideo ? (
                                  <video src={normalizedUrl} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
                                ) : (
                                  <img src={normalizedUrl} alt={`Media ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Date de publication */}
                    <div style={{ marginBottom: "var(--spacing-4)" }}>
                      <div style={{ 
                        fontSize: "var(--font-size-xs)", 
                        color: "var(--color-text-secondary)", 
                        fontWeight: "var(--font-weight-semibold)", 
                        textTransform: "uppercase",
                        marginBottom: "var(--spacing-2)"
                      }}>
                        Date de publication prévue
                      </div>
                      <div style={{ 
                        fontSize: "var(--font-size-base)", 
                        color: "var(--color-text-primary)"
                      }}>
                        {new Date(post.scheduledAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Statistiques multi-plateformes si PUBLISHED */}
                    {post.status === 'PUBLISHED' && (post as any).multiPlatformStats && (post as any).multiPlatformStats.length > 0 && (
                      <div style={{ marginBottom: "var(--spacing-4)" }}>
                        <div style={{ 
                          fontSize: "var(--font-size-xs)", 
                          color: "var(--color-text-secondary)", 
                          fontWeight: "var(--font-weight-semibold)", 
                          textTransform: "uppercase",
                          marginBottom: "var(--spacing-3)"
                        }}>
                          Statistiques multi-plateformes
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                          {(post as any).multiPlatformStats.map((stat: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                padding: "var(--spacing-4)",
                                background: "var(--color-gray-50)",
                                borderRadius: "var(--border-radius-base)",
                                border: "1px solid var(--color-border)"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                                <div style={{ 
                                  fontSize: "var(--font-size-base)", 
                                  fontWeight: "var(--font-weight-bold)",
                                  textTransform: "capitalize"
                                }}>
                                  {stat.platform}
                                </div>
                                <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                                  {stat.sentiment && (
                                    <span style={{
                                      fontSize: "var(--font-size-xs)",
                                      background: stat.sentiment === "positive" ? "#dcfce7" : stat.sentiment === "negative" ? "#fee2e2" : "#f3f4f6",
                                      color: stat.sentiment === "positive" ? "#047857" : stat.sentiment === "negative" ? "#b91c1c" : "#374151",
                                      padding: "var(--spacing-1) var(--spacing-2)",
                                      borderRadius: "var(--border-radius-base)",
                                      fontWeight: "var(--font-weight-semibold)"
                                    }}>
                                      {stat.sentiment === "positive" ? "Positif" : stat.sentiment === "negative" ? "Négatif" : "Neutre"}
                                    </span>
                                  )}
                                  {stat.sponsored && (
                                    <span style={{
                                      fontSize: "var(--font-size-xs)",
                                      background: "#fef3c7",
                                      color: "#92400e",
                                      padding: "var(--spacing-1) var(--spacing-2)",
                                      borderRadius: "var(--border-radius-base)",
                                      fontWeight: "var(--font-weight-semibold)"
                                    }}>
                                      Sponsored
                                    </span>
                                  )}
                                </div>
                              </div>
                              {stat.postUrl && (
                                <div style={{ marginBottom: "var(--spacing-2)", fontSize: "var(--font-size-sm)" }}>
                                  <a href={stat.postUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline", wordBreak: "break-all" }}>
                                    {stat.postUrl}
                                  </a>
                                </div>
                              )}
                              {stat.insights && (
                                <div style={{ 
                                  display: "grid", 
                                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", 
                                  gap: "var(--spacing-2)"
                                }}>
                                  {stat.insights.views !== undefined && (
                                    <div>
                                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>VIEWS</div>
                                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>{stat.insights.views}</div>
                                    </div>
                                  )}
                                  {stat.insights.saves !== undefined && (
                                    <div>
                                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>SAVED</div>
                                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>{stat.insights.saves}</div>
                                    </div>
                                  )}
                                  {stat.insights.likes !== undefined && (
                                    <div>
                                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>LIKES</div>
                                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>{stat.insights.likes}</div>
                                    </div>
                                  )}
                                  {stat.insights.comments !== undefined && (
                                    <div>
                                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>COMMENTS</div>
                                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>{stat.insights.comments}</div>
                                    </div>
                                  )}
                                  {stat.insights.shares !== undefined && (
                                    <div>
                                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Partage</div>
                                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>{stat.insights.shares}</div>
                                    </div>
                                  )}
                                  {stat.insights.engagement_rate !== undefined && (
                                    <div>
                                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>RER%</div>
                                      <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>{stat.insights.engagement_rate}%</div>
                                    </div>
                                  )}
                                </div>
                              )}
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
                          setSelectedPostInCalendar(null);
                          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                          scrollTimeoutRef.current = setTimeout(() => {
                            const element = document.getElementById(`post-${post._id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth", block: "center" });
                              toggleExpand(post._id);
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
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Posts List */}
        {viewMode === "list" && (
          <>
        {loading ? (
              <div className="workflow-loading">
                <p className="workflow-loading-title" style={{ color: "var(--color-text-tertiary)" }}>{t('common.loading')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
              <div className="workflow-empty">
            <Clock size={48} className="workflow-empty-icon" style={{ display: "block", margin: "0 auto" }} />
            <h3 className="workflow-empty-title">
              {t('posts.noPosts')}
            </h3>
                <p className="workflow-empty-desc">
              {t('posts.createFirst')}
            </p>
            {canCreate("workflowPosts") && (
            <Link href="/posts/new">
                  <button className="workflow-btn-primary">{t('posts.create')}</button>
            </Link>
            )}
          </div>
        ) : (
          <div className="workflow-list">
            {filteredPosts.map((post) => {
              const statusInfo = statusConfig[post.status] || statusConfig.DRAFT;
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedPosts[post._id];
              
                // Local state component for comment input
              const PostCommentInput = () => {
                const [localComment, setLocalComment] = useState("");
                
                // Sync local comment when global state is cleared (after comment sent)
                useEffect(() => {
                  // Only clear if global state is empty and local is not
                  if (!comments[post._id] && localComment) {
                    setLocalComment("");
                  }
                }, [comments[post._id]]);
                
                // Handle comment submission
                const handleLocalAddComment = async () => {
                  if (!localComment.trim()) return;
                  
                  const textToSend = localComment.trim();
                  // Clear local input immediately for better UX
                  setLocalComment("");
                  
                  try {
                    const postData = posts.find(p => p._id === post._id);
                    if (!postData) return;
                    
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
                    const updatedPosts = posts.map(p => 
                      p._id === post._id 
                        ? { ...p, comments: [...(p.comments || []), newComment] }
                        : p
                    );
                    setPosts(updatedPosts);
                    
                    // Clear global state
                    setComments(prev => ({ ...prev, [post._id]: "" }));
                    
                    // Sync with server
                    await fetch(`/api/posts/${post._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        comments: [...(postData.comments || []), newComment]
                      })
                    });
                    
                    // Refresh data in background (without blocking)
                    // Reload posts to sync with server
                    const refreshResponse = await fetch('/api/posts');
                    if (refreshResponse.ok) {
                      const refreshData = await refreshResponse.json();
                      setPosts(refreshData.posts || []);
                    }
                  } catch (error) {
                    console.error("Error adding comment:", error);
                    // Restore comment text on error
                    setLocalComment(textToSend);
                    // Reload data to get server state
                    const refreshResponse = await fetch('/api/posts');
                    if (refreshResponse.ok) {
                      const refreshData = await refreshResponse.json();
                      setPosts(refreshData.posts || []);
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
                  id={`post-${post._id}`}
                  key={post._id} 
                  className="workflow-post-card"
                  style={{
                    borderLeft: `4px solid ${statusInfo.color}`,
                    background: `${statusInfo.color}12`,
                  }}
                >
                  {/* Compact Header */}
                  <div 
                    className="workflow-post-card-header"
                    style={{
                      background: `${statusInfo.color}18`,
                    }}
                    onClick={() => toggleExpand(post._id)}
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

                        {/* Networks */}
                        {(post.networks || [post.network]).map((network, idx) => {
                          const networkConfig: any = {
                            instagram: { color: "#e4405f", Icon: Instagram, name: "IG" },
                            facebook: { color: "#1877f2", Icon: Facebook, name: "FB" },
                            tiktok: { color: "#000000", Icon: Music, name: "TT" }
                          };
                          const config = networkConfig[network];
                          const NetworkIcon = config.Icon;
                          return (
                            <span 
                              key={idx}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                background: "var(--color-white)",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                border: `1.5px solid ${config.color}`,
                                fontSize: "0.6875rem",
                                fontWeight: "600",
                                color: config.color
                              }}
                            >
                              <NetworkIcon size={12} strokeWidth={2} />
                              {config.name}
                            </span>
                          );
                        })}

                        <span style={{
                          fontSize: "0.6875rem",
                          color: "var(--color-text-tertiary)",
                          padding: "0.25rem 0.5rem",
                          background: "var(--color-white)",
                          borderRadius: "4px",
                          fontWeight: "600"
                        }}>
                          {post.type}
                        </span>

                        {getProjectNames(post).map((projectName, idx) => (
                          <span 
                            key={idx}
                            style={{
                              fontSize: "0.6875rem",
                              color: "#6366f1",
                              background: "var(--color-white)",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "1.5px solid #6366f1",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            {idx === 0 && <Briefcase size={11} strokeWidth={2} />}
                            {projectName}
                          </span>
                        ))}

                        {post.assignedTo && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            fontSize: "0.6875rem",
                            color: "white",
                            background: post.assignedTo === "infographiste" 
                              ? "linear-gradient(135deg, #ec4899, #db2777)" 
                              : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "6px",
                            fontWeight: "700"
                          }}>
                            {post.assignedTo === "infographiste" ? (
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
                        {getDisplayCaptionPost(post, language) || t('posts.withoutCaption')}
                      </p>

                      {/* Meta info */}
                      <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                        <span>📅 {new Date(post.scheduledAt).toLocaleDateString()}</span>
                        <span>💬 {post.comments?.length || 0} {t('common.comments')}</span>
                        <span>📷 {post.mediaUrls?.length || 0} {t('common.media')}</span>
                      </div>
                    </div>

                    {/* Expand button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {isExpanded ? <ChevronUp size={20} color="var(--color-text-secondary)" /> : <ChevronDown size={20} color="var(--color-text-secondary)" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <>
                      <div className="workflow-post-card-body">
                        {/* Pour les posts PUBLISHED, afficher uniquement caption + médias */}
                        {post.status === 'PUBLISHED' ? (
                          <>
                            {getDisplayCaptionPost(post, language) && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                  {t('common.caption')}
                                </div>
                                <p style={{ fontSize: "0.9375rem", color: "#111", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                  {getDisplayCaptionPost(post, language)}
                                </p>
                              </div>
                            )}

                            {/* Media Section */}
                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ 
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.75rem"
                                }}>
                                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontWeight: "700", textTransform: "uppercase" }}>
                                    📷 {t('workflow.mediaCount')} ({post.mediaUrls.length})
                                  </span>
                                </div>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
                                  {post.mediaUrls.map((url, idx) => {
                                    const normalizedUrl = getMediaUrlForContext(url, "workflow");
                                    const isVideo = url.match(/\.mp4($|\?)/i);
                                    return (
                                      <div 
                                        key={idx} 
                                        style={{ 
                                          position: "relative",
                                          borderRadius: "6px",
                                          overflow: "hidden",
                                          aspectRatio: "1",
                                          border: "2px solid var(--color-border)",
                                          cursor: "pointer"
                                        }}
                                        onClick={() => window.open(normalizedUrl, '_blank')}
                                      >
                                        {isVideo ? (
                                          <video src={normalizedUrl} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
                                        ) : (
                                          <img src={normalizedUrl} alt={`Media ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Statistics Section for PUBLISHED - Multi-platform stats */}
                            {post.status === 'PUBLISHED' && (post as any).multiPlatformStats && (post as any).multiPlatformStats.length > 0 && (
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
                                
                                {(post as any).multiPlatformStats.map((stat: any, idx: number) => (
                                  <div key={idx} style={{ 
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
                                          <BarChart3 size={12} />
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
                                          <div style={{ padding: "0.75rem", background: "var(--color-white)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                            <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>VIEWS</div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.views.toLocaleString()}</div>
                                          </div>
                                        )}
                                        {stat.insights.saves !== undefined && (
                                          <div style={{ padding: "0.75rem", background: "var(--color-white)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                            <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>SAVED</div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.saves.toLocaleString()}</div>
                                          </div>
                                        )}
                                        {stat.insights.likes !== undefined && (
                                          <div style={{ padding: "0.75rem", background: "var(--color-white)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                            <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>LIKES</div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.likes.toLocaleString()}</div>
                                          </div>
                                        )}
                                        {stat.insights.comments !== undefined && (
                                          <div style={{ padding: "0.75rem", background: "var(--color-white)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                            <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>COMMENTS</div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.comments.toLocaleString()}</div>
                                          </div>
                                        )}
                                        {stat.insights.shares !== undefined && (
                                          <div style={{ padding: "0.75rem", background: "var(--color-white)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                            <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Partage</div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.shares.toLocaleString()}</div>
                                          </div>
                                        )}
                                        {stat.insights.engagement_rate !== undefined && (
                                          <div style={{ padding: "0.75rem", background: "var(--color-white)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                            <div style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>RER%</div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>{stat.insights.engagement_rate.toFixed(2)}%</div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Statistics Section for PUBLISHED - Simple insights (fallback) */}
                            {post.insights && Object.keys(post.insights).length > 0 && !((post as any).multiPlatformStats && (post as any).multiPlatformStats.length > 0) && (
                              <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                                <div style={{ 
                                  fontSize: "0.6875rem", 
                                  color: "var(--color-text-tertiary)", 
                                  fontWeight: "700", 
                                  textTransform: "uppercase", 
                                  marginBottom: "0.75rem" 
                                }}>
                                  📊 {t('workflow.stats') || 'Statistiques'}
                                </div>
                                
                                <div style={{ 
                                  padding: "1rem",
                                  background: "var(--color-gray-50)",
                                  borderRadius: "8px",
                                  border: "1px solid var(--color-border)"
                                }}>
                                  {(post.statsPlatform || post.network) && (
                                    <div style={{ 
                                      display: "flex", 
                                      alignItems: "center", 
                                      gap: "0.5rem",
                                      marginBottom: "0.75rem"
                                    }}>
                                      <span style={{ 
                                        fontSize: "0.75rem", 
                                        fontWeight: "600", 
                                        textTransform: "uppercase",
                                        color: "var(--color-text-secondary)"
                                      }}>
                                        {post.statsPlatform || post.network}
                                      </span>
                                      {post.postUrl && (
                                        <a 
                                          href={post.postUrl} 
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
                                          <BarChart3 size={12} />
                                          Voir la publication
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div style={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
                                    gap: "0.75rem" 
                                  }}>
                                    {metricKeys.map((key) => {
                                      const value = post.insights?.[key];
                                      if (value === undefined || value === null) return null;
                                      
                                      const displayValue = key === "engagement_rate" 
                                        ? `${value.toFixed(2)}%` 
                                        : typeof value === 'number' 
                                        ? value.toLocaleString() 
                                        : value;
                                      
                                      return (
                                        <div key={key} style={{ 
                                          padding: "0.75rem",
                                          background: "var(--color-white)",
                                          borderRadius: "6px",
                                          border: "1px solid var(--color-border)"
                                        }}>
                                          <div style={{ 
                                            fontSize: "0.625rem", 
                                            color: "var(--color-text-tertiary)",
                                            textTransform: "uppercase",
                                            marginBottom: "0.25rem"
                                          }}>
                                            {metricsLabels[key]}
                                          </div>
                                          <div style={{ 
                                            fontSize: "1.125rem", 
                                            fontWeight: "700",
                                            color: "var(--color-text-primary)"
                                          }}>
                                            {displayValue}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {post.sentiment && (
                                    <div style={{ 
                                      marginTop: "0.75rem",
                                      padding: "0.5rem",
                                      background: post.sentiment === "positive" ? "#10b98115" : post.sentiment === "negative" ? "#ef444415" : "#f59e0b15",
                                      borderRadius: "4px",
                                      fontSize: "0.75rem",
                                      color: post.sentiment === "positive" ? "#10b981" : post.sentiment === "negative" ? "#ef4444" : "#f59e0b"
                                    }}>
                                      Sentiment: {post.sentiment === "positive" ? "✅ Positif" : post.sentiment === "negative" ? "❌ Négatif" : "⚪ Neutre"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                        {getDisplayDescriptionPost(post, language) && (
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
                            <div style={{ fontSize: "0.8125rem", color: "#666" }}>{getDisplayDescriptionPost(post, language)}</div>
                          </div>
                        )}

                        {getDisplayCaptionPost(post, language) && (
                          <div style={{ marginBottom: "1rem" }}>
                            <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                              {t('common.caption')}
                            </div>
                            <p style={{ fontSize: "0.9375rem", color: "#111", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                              {getDisplayCaptionPost(post, language)}
                            </p>
                          </div>
                        )}

                        {post.hashtags && (
                          <div style={{ marginBottom: "1rem" }}>
                            <div style={{ fontSize: "0.875rem", color: "#3b82f6", fontWeight: "500" }}>
                              {post.hashtags}
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
                              📷 {t('workflow.mediaCount')} ({post.mediaUrls?.length || 0})
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {post.status === 'SCHEDULED' && post.mediaUrls && post.mediaUrls.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDownloadMediaHD(post); }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.375rem 0.75rem",
                                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                  }}
                                  title={t('workflow.downloadMediaHD')}
                                >
                                  <Download size={12} strokeWidth={2} />
                                  {t('workflow.downloadMediaHD')}
                                </button>
                              )}
                            {(userRole === 'graphiste' && (post.status === 'PENDING_GRAPHIC' || post.status === 'PENDING_CORRECTION')) || isAdmin ? (
                              <>
                              <label style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                padding: "0.375rem 0.75rem",
                                background: isAdmin 
                                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                  : post.status === 'PENDING_CORRECTION'
                                  ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                                  : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                color: "white",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: uploading[post._id] ? "not-allowed" : "pointer"
                              }}>
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*,video/*"
                                  onChange={(e) => e.target.files && handleMediaUpload(post._id, e.target.files)}
                                  disabled={uploading[post._id]}
                                  style={{ display: "none" }}
                                />
                                <Upload size={12} strokeWidth={2} />
                                {uploading[post._id] ? t('workflow.uploading') : t('workflow.add')}
                              </label>
                              {uploading[post._id] && uploadProgress[post._id] && (
                                <div style={{ marginTop: "6px", width: "100%", maxWidth: 200 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: 2 }}>
                                    <span>{uploadProgress[post._id].currentFile ? `${uploadProgress[post._id].currentFile.slice(0, 18)}${(uploadProgress[post._id].currentFile?.length || 0) > 18 ? "…" : ""}` : ""}</span>
                                    {uploadProgress[post._id].total && uploadProgress[post._id].total > 1 && (
                                      <span>{uploadProgress[post._id].current}/{uploadProgress[post._id].total}</span>
                                    )}
                                  </div>
                                  <div style={{ height: 6, borderRadius: 3, background: "var(--color-border)", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${uploadProgress[post._id].percent}%`, background: "var(--color-primary)", transition: "width 0.2s ease" }} />
                                  </div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{uploadProgress[post._id].percent}%</div>
                                </div>
                              )}
                              </>
                            ) : null}
                          </div>
                          </div>
                          
                          {post.mediaUrls && post.mediaUrls.length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                              {post.mediaUrls.map((url, idx) => {
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
                                        <video src={normalizedUrl} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
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
                                    {(userRole === 'graphiste' && (post.status === 'PENDING_GRAPHIC' || post.status === 'PENDING_CORRECTION')) || isAdmin ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveMedia(post._id, idx); }}
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
                          ) : (userRole === 'graphiste' && (post.status === 'PENDING_GRAPHIC' || post.status === 'PENDING_CORRECTION')) || isAdmin ? (
                            <label style={{
                              display: "block",
                              padding: "1.5rem",
                              border: `2px dashed ${
                                isAdmin ? '#667eea' : 
                                post.status === 'PENDING_CORRECTION' ? '#f97316' : 
                                '#8b5cf6'
                              }`,
                              borderRadius: "8px",
                              textAlign: "center",
                              cursor: "pointer",
                              background: isAdmin 
                                ? "#667eea08" 
                                : post.status === 'PENDING_CORRECTION' 
                                ? "#f9731608" 
                                : "#8b5cf608"
                            }}>
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*,video/*"
                                onChange={(e) => e.target.files && handleMediaUpload(post._id, e.target.files)}
                                style={{ display: "none" }}
                              />
                              <Upload size={28} strokeWidth={1.5} style={{ 
                                opacity: 0.4, 
                                margin: "0 auto 0.5rem", 
                                color: isAdmin 
                                  ? "#667eea" 
                                  : post.status === 'PENDING_CORRECTION' 
                                  ? "#f97316" 
                                  : "#8b5cf6" 
                              }} />
                              <p style={{ 
                                fontSize: "0.8125rem", 
                                fontWeight: "600", 
                                color: isAdmin 
                                  ? "#667eea" 
                                  : post.status === 'PENDING_CORRECTION' 
                                  ? "#f97316" 
                                  : "#8b5cf6" 
                              }}>
                                {t('workflow.uploadVisuals')}
                              </p>
                            </label>
                          ) : null}
                        </div>

                      {/* Comments */}
                        {post.comments && post.comments.length > 0 && (
                          <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                              💬 {t('workflow.commentsCount')} ({post.comments.length})
                            </div>
                            {post.comments.map((comment: any, idx: number) => (
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
                        <PostCommentInput />
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
                        {(userRole === 'digital' || isAdmin) && post.status === 'DRAFT' && (
                          <>
                            {isAdmin && canWorkflow("workflowPosts") && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Validate button clicked for admin');
                                  handleValidate(post._id);
                                }}
                                className="btn-meta btn-meta-primary" 
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-success)", display: "flex", gap: "0.375rem", alignItems: "center", cursor: "pointer" }}
                                type="button"
                              >
                                <Check size={14} strokeWidth={2.5} /> {t('posts.validate')}
                              </button>
                            )}
                            {canUpdate("workflowPosts") && (
                            <Link href={`/posts/${post._id}/edit`}>
                              <button className="btn-meta btn-meta-secondary" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}>
                                <Edit size={14} /> {t('common.edit')}
                              </button>
                            </Link>
                            )}
                            {canDelete("workflowPosts") && (
                            <button 
                              onClick={() => handleDelete(post._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                            )}
                          </>
                        )}

                        {/* Admin - Actions sur tous les statuts (sauf DRAFT géré au-dessus, SCHEDULED déjà couvert, et PUBLISHED) */}
                        {isAdmin && post.status !== 'DRAFT' && post.status !== 'SCHEDULED' && post.status !== 'PUBLISHED' && (
                          <>
                            {/* Admin peut aussi approuver/rejeter en révision */}
                            {post.status === 'CLIENT_REVIEW' && canWorkflow("workflowPosts") && (
                              <>
                                <button 
                                  onClick={async () => {
                                    const response = await fetch('/api/posts/workflow', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ postId: post._id, action: 'APPROVE_POST', comment: comments[post._id] || t('posts.approved'), role: 'ADMIN' })
                                    });
                                    if (response.ok) {
                                      const data = await response.json();
                                      setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                      setComments({ ...comments, [post._id]: '' });
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
                                    const response = await fetch('/api/posts/workflow', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ postId: post._id, action: 'REJECT_POST', comment: comments[post._id] || t('workflow.rejectSuccess'), role: 'ADMIN' })
                                    });
                                    if (response.ok) {
                                      const data = await response.json();
                                      setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                      setComments({ ...comments, [post._id]: '' });
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
                            {post.status === 'PENDING_GRAPHIC' && canWorkflow("workflowPosts") && (
                              <button 
                                onClick={async () => {
                                  const response = await fetch('/api/posts/workflow', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ postId: post._id, action: 'SUBMIT_GRAPHIC', comment: comments[post._id] || t('workflow.submitGraphicSuccess'), role: 'ADMIN' })
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                    setComments({ ...comments, [post._id]: '' });
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
                            {post.status === 'PENDING_CORRECTION' && canWorkflow("workflowPosts") && (
                              <button 
                                onClick={async () => {
                                  const response = await fetch('/api/posts/workflow', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ postId: post._id, action: 'RESUBMIT_CORRECTION', comment: comments[post._id] || t('workflow.resubmitSuccess'), role: 'ADMIN' })
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                    setComments({ ...comments, [post._id]: '' });
                                    alert(t('workflow.resubmitSuccess'));
                                  }
                                }}
                                className="btn-meta btn-meta-primary" 
                                style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#f97316", display: "flex", gap: "0.375rem", alignItems: "center" }}
                              >
                                <Send size={14} strokeWidth={2.5} /> {t('workflow.resubmit')}
                              </button>
                            )}
                            
                            {canUpdate("workflowPosts") && (
                            <Link href={`/posts/${post._id}/edit`}>
                              <button className="btn-meta btn-meta-secondary" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}>
                                <Edit size={14} /> {t('common.edit')}
                              </button>
                            </Link>
                            )}
                            {canDelete("workflowPosts") && (
                            <button 
                              onClick={() => handleDelete(post._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                            )}
                          </>
                        )}

                        {/* Client */}
                        {userRole === 'client' && post.status === 'DRAFT' && (
                          <>
                            {canWorkflow("workflowPosts") && (
                            <button 
                              onClick={() => handleValidate(post._id)}
                              className="btn-meta btn-meta-primary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-success)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Check size={14} strokeWidth={2.5} /> {t('posts.validate')}
                            </button>
                            )}
                            {canDelete("workflowPosts") && (
                            <button 
                              onClick={() => handleDelete(post._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                            )}
                          </>
                        )}

                        {/* Client - Actions sur révision (Admin géré dans section Admin) */}
                        {userRole === 'client' && !isAdmin && post.status === 'CLIENT_REVIEW' && canWorkflow("workflowPosts") && (
                          <>
                            <button 
                              onClick={async () => {
                                const response = await fetch('/api/posts/workflow', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ postId: post._id, action: 'APPROVE_POST', comment: comments[post._id] || t('posts.approved'), role: 'CLIENT' })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                  setComments({ ...comments, [post._id]: '' });
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
                                const response = await fetch('/api/posts/workflow', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ postId: post._id, action: 'REJECT_POST', comment: comments[post._id] || t('workflow.rejectSuccess'), role: 'CLIENT' })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                  setComments({ ...comments, [post._id]: '' });
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
                        {userRole === 'graphiste' && post.status === 'CLIENT_REVIEW' && (
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
                        {userRole === 'graphiste' && !isAdmin && post.status === 'PENDING_GRAPHIC' && canWorkflow("workflowPosts") && (
                          <button 
                            onClick={async () => {
                              const response = await fetch('/api/posts/workflow', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ postId: post._id, action: 'SUBMIT_GRAPHIC', comment: comments[post._id] || t('workflow.submitGraphicSuccess'), role: 'GRAPHIC_DESIGNER' })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                setComments({ ...comments, [post._id]: '' });
                                alert(t('workflow.submitGraphicSuccess'));
                              }
                            }}
                            className="btn-meta btn-meta-primary" 
                            style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#8b5cf6", display: "flex", gap: "0.375rem", alignItems: "center" }}
                          >
                            <Send size={14} strokeWidth={2.5} /> {t('workflow.submitToClient')}
                          </button>
                        )}

                        {userRole === 'graphiste' && !isAdmin && post.status === 'PENDING_CORRECTION' && canWorkflow("workflowPosts") && (
                          <button 
                            onClick={async () => {
                              const response = await fetch('/api/posts/workflow', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ postId: post._id, action: 'RESUBMIT_CORRECTION', comment: comments[post._id] || t('workflow.resubmitSuccess'), role: 'GRAPHIC_DESIGNER' })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setPosts(posts.map(p => p._id === post._id ? data.post : p));
                                setComments({ ...comments, [post._id]: '' });
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
                        {(userRole === 'digital' || userRole === 'client' || isAdmin) && post.status === 'SCHEDULED' && (
                          <>
                            {canWorkflow("workflowPosts") && (
                            <button
                              onClick={() => openStatsEditor(post, "publish")}
                              className="btn-meta btn-meta-primary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-primary)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <CheckCircle size={14} strokeWidth={2.5} /> {t('workflow.markAsPublished')}
                            </button>
                            )}
                            {canUpdate("workflowPosts") && (
                            <Link href={`/posts/${post._id}/edit`}>
                              <button className="btn-meta btn-meta-secondary" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", display: "flex", gap: "0.375rem", alignItems: "center" }}>
                                <Edit size={14} /> {t('common.edit')}
                              </button>
                            </Link>
                            )}
                            {canDelete("workflowPosts") && (
                            <button 
                              onClick={() => handleDelete(post._id)}
                              className="btn-meta btn-meta-secondary" 
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <Trash2 size={14} /> {t('common.delete')}
                            </button>
                            )}
                          </>
                        )}

                        {/* Bouton Ajouter statistiques pour PUBLISHED */}
                        {(userRole === 'digital' || userRole === 'client' || isAdmin) && post.status === 'PUBLISHED' && (
                          <>
                            {canUpdate("workflowPosts") && (
                            <button
                              onClick={() => {
                                setMultiPlatformStatsContext({ postId: post._id });
                                // Charger les statistiques existantes si elles existent et les convertir au format du formulaire
                                const existingStats = (post as any).multiPlatformStats || [];
                                if (existingStats.length > 0) {
                                  // Convertir les statistiques existantes au format du formulaire
                                  const formattedStats = existingStats.map((stat: any) => ({
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
                                  }));
                                  setMultiPlatformStats(formattedStats);
                                } else {
                                  // Aucune statistique existante, créer un formulaire vide
                                  setMultiPlatformStats([{
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
                                }
                              }}
                              className="btn-meta btn-meta-primary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "var(--color-primary)", display: "flex", gap: "0.375rem", alignItems: "center" }}
                            >
                              <BarChart3 size={14} strokeWidth={2.5} /> {(() => {
                                const hasStats = (post as any).multiPlatformStats && (post as any).multiPlatformStats.length > 0;
                                return hasStats ? "Modifier statistiques" : "Ajouter statistiques";
                              })()}
                            </button>
                            )}
                            {canDelete("workflowPosts") && (
                            <button
                              onClick={() => handleDelete(post._id)}
                              className="btn-meta btn-meta-secondary"
                              style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", display: "flex", gap: "0.375rem", alignItems: "center" }}
                              title={t('workflow.deleteFromDb') || "Supprimer cette publication de la base"}
                            >
                              <Trash2 size={14} strokeWidth={2.5} /> {t('workflow.deleteFromDb') || "Supprimer de la base"}
                            </button>
                            )}
                          </>
                        )}

                      </div>

                      {statsContext?.postId === post._id && (
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
                      {multiPlatformStatsContext?.postId === post._id && (
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
      </div>
    </div>
  );
}
