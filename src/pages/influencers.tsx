import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { Instagram, Users, TrendingUp, DollarSign, Plus, Filter, MapPin, Globe, Edit2, Trash2, ExternalLink, X as XIcon, Mail, Phone } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";
import { getDisplayNotesInfluencer, useTranslateInfluencerNotesWhenIt } from "@/lib/i18n-content";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";

type Platform = {
  network: string;
  handle: string;
  url?: string;
  followers?: number;
  avgViews?: number;
  avgEngagementRate?: number;
};

type Influencer = {
  _id: string;
  projectId: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  platforms?: Platform[];
  niches?: string[];
  country?: string;
  city?: string;
  languages?: string[];
  rates?: {
    story?: number;
    post?: number;
    reel?: number;
    tiktok?: number;
    package?: number;
    currency?: string;
  };
  portfolioUrls?: string[];
  notes?: string;
  notesIt?: string;
  status?: string;
};

type Project = {
  _id: string;
  name: string;
};

export default function InfluencersPage() {
  const { t, language } = useTranslation();
  const { canSeeInfluencerContact } = useAuth();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  useTranslateInfluencerNotesWhenIt(language, influencers, setInfluencers as any);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "followers_asc" | "followers_desc">("default");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [newInfluencer, setNewInfluencer] = useState<any>({
    projectId: "",
    name: "",
    firstName: "",
    lastName: "",
    country: "",
    city: "",
    targetMarket: "",
    email: "",
    phone: "",
    description: "",
    descriptionIt: "",
    avatarUrl: "",
    platforms: [],
    niches: [],
    languages: [],
    portfolioUrls: [],
    rates: { story: undefined, post: undefined, reel: undefined, tiktok: undefined, package: undefined, currency: "EUR" },
    status: "active"
  });
  const [nicheInput, setNicheInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [portfolioUrlInput, setPortfolioUrlInput] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [isCollecting, setIsCollecting] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState({
    handle: "",
    followers: "",
    engagement: "",
    avgViews: ""
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInfluencerDetails, setSelectedInfluencerDetails] = useState<Influencer | null>(null);
  const [editingPlatformIndex, setEditingPlatformIndex] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const normalizeInfluencer = (inf: Influencer): Influencer => {
    const fallbackDescription: any = (inf as any).description;
    if (!inf.notes && fallbackDescription) {
      return { ...inf, notes: fallbackDescription };
    }
    return inf;
  };

  const load = async () => {
    try {
      const [influencersRes, projectsRes] = await Promise.all([
        axios.get("/api/influencers"),
        axios.get("/api/projects")
      ]);
      const fetchedInfluencers: Influencer[] = influencersRes.data.influencers || [];
      setInfluencers(fetchedInfluencers.map(normalizeInfluencer));
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredInfluencers = influencers.filter(inf => {
    if (projectFilter !== "all" && inf.projectId !== projectFilter) return false;
    if (countryFilter !== "all") {
      const infCountry = (inf.country || "").trim().toLowerCase();
      const filterCountry = countryFilter.trim().toLowerCase();
      if (!infCountry || infCountry !== filterCountry) return false;
    }
    if (keywordSearch.trim()) {
      const q = keywordSearch.trim().toLowerCase();
      const name = (inf.name || "").toLowerCase();
      const notes = (inf.notes || "").toLowerCase();
      const notesIt = (inf.notesIt || "").toLowerCase();
      const niches = (inf.niches || []).join(" ").toLowerCase();
      const searchable = `${name} ${notes} ${notesIt} ${niches}`;
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  const getTotalFollowers = (inf: Influencer) => {
    return inf.platforms?.reduce((sum, p) => sum + (p.followers || 0), 0) || 0;
  };

  const sortedInfluencers = [...filteredInfluencers].sort((a, b) => {
    if (sortBy === "followers_desc") return getTotalFollowers(b) - getTotalFollowers(a);
    if (sortBy === "followers_asc") return getTotalFollowers(a) - getTotalFollowers(b);
    return 0;
  });

  const uniqueCountries = Array.from(
    new Set(influencers.map(inf => (inf.country || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvgEngagement = (inf: Influencer) => {
    const platforms = inf.platforms?.filter(p => p.avgEngagementRate) || [];
    if (platforms.length === 0) return 0;
    return platforms.reduce((sum, p) => sum + (p.avgEngagementRate || 0), 0) / platforms.length;
  };

  const openDetailsModal = (influencer: Influencer) => {
    setSelectedInfluencerDetails(normalizeInfluencer(influencer));
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInfluencerDetails(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/local", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success && data.url) {
        setNewInfluencer((prev: typeof newInfluencer) => ({ ...prev, avatarUrl: data.url }));
      } else {
        alert(data.error || t("influencers.uploadError"));
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert(t("influencers.uploadError"));
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const networkIcons: any = {
    instagram: "📷",
    facebook: "📘",
    tiktok: "🎵",
    threads: "🧵",
    youtube: "▶️",
    x: "𝕏",
    snapchat: "👻",
    linkedin: "💼",
    other: "🌐"
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num == null || typeof num !== "number" || Number.isNaN(num)) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleAddInfluencer = async () => {
    try {
      // Validate project selection
      if (!newInfluencer.projectId || newInfluencer.projectId === "all") {
        alert("Veuillez sélectionner un projet spécifique pour cet influenceur.");
        return;
      }

      // Combine firstName and lastName to name
      const fullName = `${newInfluencer.firstName} ${newInfluencer.lastName}`.trim();
      const notesValue = newInfluencer.description?.trim() || "";
      const ratesPayload: any = { currency: newInfluencer.rates?.currency || "EUR" };
      if (newInfluencer.rates?.story != null && newInfluencer.rates.story !== "") ratesPayload.story = Number(newInfluencer.rates.story);
      if (newInfluencer.rates?.post != null && newInfluencer.rates.post !== "") ratesPayload.post = Number(newInfluencer.rates.post);
      if (newInfluencer.rates?.reel != null && newInfluencer.rates.reel !== "") ratesPayload.reel = Number(newInfluencer.rates.reel);
      if (newInfluencer.rates?.tiktok != null && newInfluencer.rates.tiktok !== "") ratesPayload.tiktok = Number(newInfluencer.rates.tiktok);
      if (newInfluencer.rates?.package != null && newInfluencer.rates.package !== "") ratesPayload.package = Number(newInfluencer.rates.package);
      const influencerData: any = {
        projectId: newInfluencer.projectId,
        name: (fullName || newInfluencer.name).trim().toUpperCase(),
        email: newInfluencer.email?.trim() || undefined,
        phone: newInfluencer.phone?.trim() || undefined,
        country: newInfluencer.country?.trim() || undefined,
        city: newInfluencer.city?.trim() || undefined,
        targetMarket: newInfluencer.targetMarket?.trim() || undefined,
        platforms: newInfluencer.platforms,
        niches: newInfluencer.niches || [],
        languages: newInfluencer.languages || [],
        portfolioUrls: newInfluencer.portfolioUrls || [],
        rates: ratesPayload,
        notes: notesValue || undefined,
        notesIt: newInfluencer.descriptionIt?.trim() || undefined,
        avatarUrl: newInfluencer.avatarUrl?.trim() || undefined,
        status: newInfluencer.status || "active"
      };
      
      // Create only one influencer for the selected project
      await axios.post("/api/influencers", influencerData);
      
      setShowAddModal(false);
      setEditingInfluencer(null);
      setNewInfluencer({
        projectId: "",
        name: "",
        firstName: "",
        lastName: "",
        country: "",
        city: "",
        targetMarket: "",
        email: "",
        phone: "",
        description: "",
        descriptionIt: "",
        avatarUrl: "",
        platforms: [],
        niches: [],
        languages: [],
        portfolioUrls: [],
        rates: { story: undefined, post: undefined, reel: undefined, tiktok: undefined, package: undefined, currency: "EUR" },
        status: "active"
      });
      await load();
      alert(t('influencers.addSuccess'));
    } catch (error) {
      console.error("Error adding influencer:", error);
      alert(t('influencers.addError'));
    }
  };

  const handleUpdateInfluencer = async () => {
    if (!editingInfluencer) return;
    
    try {
      const fullName = `${newInfluencer.firstName} ${newInfluencer.lastName}`.trim();
      const notesValue = newInfluencer.description?.trim() || "";
      const ratesPayload: any = { currency: newInfluencer.rates?.currency || "EUR" };
      if (newInfluencer.rates?.story != null && newInfluencer.rates.story !== "") ratesPayload.story = Number(newInfluencer.rates.story);
      if (newInfluencer.rates?.post != null && newInfluencer.rates.post !== "") ratesPayload.post = Number(newInfluencer.rates.post);
      if (newInfluencer.rates?.reel != null && newInfluencer.rates.reel !== "") ratesPayload.reel = Number(newInfluencer.rates.reel);
      if (newInfluencer.rates?.tiktok != null && newInfluencer.rates.tiktok !== "") ratesPayload.tiktok = Number(newInfluencer.rates.tiktok);
      if (newInfluencer.rates?.package != null && newInfluencer.rates.package !== "") ratesPayload.package = Number(newInfluencer.rates.package);
      const influencerData: any = {
        projectId: newInfluencer.projectId === "all" ? editingInfluencer.projectId : newInfluencer.projectId,
        name: (fullName || newInfluencer.name).trim().toUpperCase(),
        email: newInfluencer.email?.trim() || undefined,
        phone: newInfluencer.phone?.trim() || undefined,
        country: newInfluencer.country?.trim() || undefined,
        city: newInfluencer.city?.trim() || undefined,
        targetMarket: newInfluencer.targetMarket?.trim() || undefined,
        platforms: newInfluencer.platforms,
        niches: newInfluencer.niches || [],
        languages: newInfluencer.languages || [],
        portfolioUrls: newInfluencer.portfolioUrls || [],
        rates: ratesPayload,
        notes: notesValue,
        notesIt: newInfluencer.descriptionIt?.trim() || undefined,
        avatarUrl: newInfluencer.avatarUrl?.trim() || undefined,
        status: newInfluencer.status || "active"
      };
      
      await axios.patch(`/api/influencers/${editingInfluencer._id}`, influencerData);
      
      setShowAddModal(false);
      setEditingInfluencer(null);
      setNewInfluencer({
        projectId: "",
        name: "",
        firstName: "",
        lastName: "",
        country: "",
        city: "",
        targetMarket: "",
        email: "",
        phone: "",
        description: "",
        descriptionIt: "",
        avatarUrl: "",
        platforms: [],
        niches: [],
        languages: [],
        portfolioUrls: [],
        rates: { story: undefined, post: undefined, reel: undefined, tiktok: undefined, package: undefined, currency: "EUR" },
        status: "active"
      });
      await load();
      alert(t('influencers.updateSuccess'));
    } catch (error) {
      console.error("Error updating influencer:", error);
      alert(t('influencers.updateError'));
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    if (!confirm(t('influencers.deleteConfirm'))) {
      return;
    }
    
    try {
      await axios.delete(`/api/influencers/${id}`);
      await load();
      alert(t('influencers.deleteSuccess'));
    } catch (error) {
      console.error("Error deleting influencer:", error);
      alert(t('influencers.deleteError'));
    }
  };

  const handleEditInfluencer = (influencer: Influencer) => {
    // Split name into firstName and lastName
    const nameParts = influencer.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditingInfluencer(influencer);
    setNewInfluencer({
      projectId: influencer.projectId || "",
      name: influencer.name,
      firstName: firstName,
      lastName: lastName,
      country: influencer.country || "",
      city: influencer.city || "",
      targetMarket: (influencer as any).targetMarket || "",
      email: influencer.email || "",
      phone: influencer.phone || "",
      description: influencer.notes || (influencer as any).description || "",
      descriptionIt: (influencer as any).notesIt || "",
      avatarUrl: influencer.avatarUrl || "",
      platforms: influencer.platforms || [],
      niches: influencer.niches || [],
      languages: influencer.languages || [],
      portfolioUrls: influencer.portfolioUrls || [],
      rates: {
        story: influencer.rates?.story,
        post: influencer.rates?.post,
        reel: influencer.rates?.reel,
        tiktok: influencer.rates?.tiktok,
        package: influencer.rates?.package,
        currency: influencer.rates?.currency || "EUR"
      },
      status: (influencer as any).status || "active"
    });
    setShowAddModal(true);
  };

  const collectPlatformData = async (platform: string, url: string) => {
    setIsCollecting(true);
    try {
      const response = await axios.post('/api/influencers/collect', {
        platform: platform,
        url: url,
        influencerName: newInfluencer.name || undefined
      });
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        const newPlatform = {
          network: platform,
          handle: data.handle || "",
          url: url,
          followers: data.followers || 0,
          avgEngagementRate: data.avgEngagementRate || 0,
          avgViews: data.avgViews || 0
        };
        
        setNewInfluencer({
          ...newInfluencer,
          platforms: [...newInfluencer.platforms, newPlatform]
        });
        
        setPlatformUrl("");
        const sourceLabel = data.source === "openai_estimate" ? " (estimation OpenAI)" : "";
        alert(`✅ Données collectées${sourceLabel}!\n\n📊 ${(data.followers || 0).toLocaleString()} followers\n💚 ${(data.avgEngagementRate || 0).toFixed(2)}% engagement\n👁️ ${(data.avgViews || 0).toLocaleString()} vues moyennes\n🎯 ${(data.reach || 0).toLocaleString()} reach`);
      } else {
        throw new Error(response.data.error || "Erreur lors de la collecte des données");
      }
    } catch (error: any) {
      console.error("Error collecting data:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || t('influencers.collectError');
      
      // Show helpful message about API configuration
      let userMessage = `❌ ${errorMessage}`;
      
      if (errorMessage.includes("API access") || errorMessage.includes("requires") || errorMessage.includes("META_APP_ID")) {
        userMessage += "\n\n💡 Pour collecter les vraies données :\n";
        
        if (errorMessage.includes("Facebook") || errorMessage.includes("META") || errorMessage.includes("pages connectées")) {
          userMessage += "• Facebook :\n";
          userMessage += "  ✅ Pages que vous gérez : Collecte automatique via OAuth\n";
          userMessage += "  ⚠️  Pages publiques (non gérées) : Saisie manuelle requise\n";
          userMessage += "  💡 Connectez vos pages via /api/auth/meta/login pour la collecte automatique\n";
        }
        
        if (errorMessage.includes("YouTube")) {
          userMessage += "• YouTube : YOUTUBE_API_KEY dans .env (optionnel, pour collecte YouTube)\n";
        }
        
        if (errorMessage.includes("Instagram") || errorMessage.includes("TikTok") || errorMessage.includes("RapidAPI")) {
          userMessage += "• Instagram/TikTok : RAPIDAPI_KEY dans .env (optionnel, nécessite compte RapidAPI)\n";
          userMessage += "  ou OPENAI_API_KEY pour une estimation automatique (followers + engagement %)\n";
        }
        
        userMessage += "\n📝 Note : Facebook devrait fonctionner automatiquement avec vos credentials Meta actuels.";
      }
      
      alert(userMessage);
    } finally {
      setIsCollecting(false);
    }
  };

  const removePlatform = (index: number) => {
    setNewInfluencer(prev => ({
      ...prev,
      platforms: prev.platforms.filter((_: any, i: number) => i !== index)
    }));
    if (editingPlatformIndex !== null) {
      if (index === editingPlatformIndex) {
        setEditingPlatformIndex(null);
        setManualData({ handle: "", followers: "", engagement: "", avgViews: "" });
        setPlatformUrl("");
      } else if (index < editingPlatformIndex) {
        setEditingPlatformIndex(editingPlatformIndex - 1);
      }
    }
  };

  // Platforms that support automatic collection
  const platformsWithAutoCollection = ['youtube']; // Only YouTube for now (requires YOUTUBE_API_KEY)
  const canAutoCollect = platformsWithAutoCollection.includes(selectedPlatform);
  
  // Auto-set manual mode for platforms without auto collection
  useEffect(() => {
    if (!canAutoCollect) {
      setManualMode(true);
    }
  }, [selectedPlatform, canAutoCollect]);

  const addPlatformManually = () => {
    if (!manualData.handle) {
      alert(t('influencers.handleRequired'));
      return;
    }

    // Extract handle from URL if provided
    let handle = manualData.handle;
    try {
      const urlObj = new URL(manualData.handle);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      handle = pathParts[0] || handle.replace(/[@\/]/g, '');
    } catch {
      handle = handle.replace(/[@\/]/g, '');
    }

    const newPlatform = {
      network: selectedPlatform,
      handle: handle,
      url: platformUrl || `https://${selectedPlatform === 'x' ? 'x.com' : selectedPlatform === 'facebook' ? 'facebook.com' : selectedPlatform === 'threads' ? 'threads.net' : selectedPlatform + '.com'}/${handle}`,
      followers: parseInt(manualData.followers) || 0,
      avgEngagementRate: parseFloat(manualData.engagement) || 0,
      avgViews: parseInt(manualData.avgViews) || 0
    };

    setNewInfluencer(prev => {
      const updatedPlatforms = [...prev.platforms];
      if (editingPlatformIndex !== null) {
        updatedPlatforms[editingPlatformIndex] = newPlatform;
      } else {
        updatedPlatforms.push(newPlatform);
      }
      return {
        ...prev,
        platforms: updatedPlatforms
      };
    });

    // Reset form
    setPlatformUrl("");
    setManualData({ handle: "", followers: "", engagement: "", avgViews: "" });
    setManualMode(false);
    setEditingPlatformIndex(null);
  };

  // Statistics by project
  const projectStats = projects.map(project => {
    const projectInfluencers = influencers.filter(inf => inf.projectId === project._id);
    const totalFollowers = projectInfluencers.reduce((sum, inf) => sum + getTotalFollowers(inf), 0);
    const avgEngagement = projectInfluencers.length > 0
      ? projectInfluencers.reduce((sum, inf) => sum + getAvgEngagement(inf), 0) / projectInfluencers.length
      : 0;
    
    return {
      projectId: project._id,
      projectName: project.name,
      count: projectInfluencers.length,
      totalFollowers,
      avgEngagement
    };
  }).filter(stat => stat.count > 0);

  return (
    <div className="page-container">
      <div className="page-content dash">
        {/* Hero bleu (charte dashboard) */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: t('influencers.title') }
                ]} />
              </div>
              <h1 className="page-hero-title">{t('influencers.title')}</h1>
              <p className="page-hero-subtitle">
                {sortedInfluencers.length} {t('influencers.title')}{sortedInfluencers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="page-hero-actions">
              <button
                onClick={() => {
                  setEditingInfluencer(null);
                  setNewInfluencer({
                    projectId: "",
                    name: "",
                    firstName: "",
                    lastName: "",
                    country: "",
                    city: "",
                    targetMarket: "",
                    email: "",
                    phone: "",
                    description: "",
                    descriptionIt: "",
                    avatarUrl: "",
                    platforms: [],
                    niches: [],
                    languages: [],
                    portfolioUrls: [],
                    rates: { story: undefined, post: undefined, reel: undefined, tiktok: undefined, package: undefined, currency: "EUR" },
                    status: "active"
                  });
                  setShowAddModal(true);
                }}
                className="page-hero-btn"
              >
                <Plus size={18} strokeWidth={2.5} />
                {t('influencers.addInfluencer')}
              </button>
            </div>
          </div>
        </div>

        <div className="dash-section influencers-page">
          {/* Barre de filtres */}
          <div className="influencers-filters">
            <div className="influencers-filters-inner">
              <div className="influencers-filters-row">
                <div className="influencers-filter-group">
                  <label className="influencers-filter-label">{t('common.project')}</label>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="influencers-filter-select"
                  >
                    <option value="all">{t('influencers.allProjects')}</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="influencers-filter-group">
                  <label className="influencers-filter-label">{t('influencers.country')}</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="influencers-filter-select"
                  >
                    <option value="all">{t('influencers.allCountries')}</option>
                    {uniqueCountries.map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="influencers-filter-group influencers-filter-group-keywords">
                  <label className="influencers-filter-label">{t('influencers.keywords')}</label>
                  <input
                    type="search"
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    placeholder={t('influencers.keywordsPlaceholder')}
                    className="influencers-filter-input"
                    aria-label={t('influencers.keywords')}
                  />
                </div>
                <div className="influencers-filter-group influencers-filter-group-sort">
                  <label className="influencers-filter-label">{t('influencers.sortBy')}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "default" | "followers_asc" | "followers_desc")}
                    className="influencers-filter-select"
                  >
                    <option value="default">{t('influencers.sortDefault')}</option>
                    <option value="followers_desc">{t('influencers.sortFollowersDesc')}</option>
                    <option value="followers_asc">{t('influencers.sortFollowersAsc')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats par projet */}
          {projectStats.length > 0 && (
            <div className="influencers-stats">
              {projectStats.map(stat => (
                <div key={stat.projectId} className="influencers-stat-card">
                  <div className="influencers-stat-label">💼 {stat.projectName}</div>
                  <div className="influencers-stat-row">
                    <div className="influencers-stat-item">
                      <span className="influencers-stat-value">{stat.count}</span>
                      <span className="influencers-stat-sublabel">{t('influencers.title')}{stat.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="influencers-stat-item">
                      <span className="influencers-stat-value influencers-stat-value-accent">{formatNumber(stat.totalFollowers)}</span>
                      <span className="influencers-stat-sublabel">{t('influencers.followers')}</span>
                    </div>
                    <div className="influencers-stat-item">
                      <span className="influencers-stat-value influencers-stat-value-accent">{stat.avgEngagement.toFixed(1)}%</span>
                      <span className="influencers-stat-sublabel">{t('influencers.engagement')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Grille influenceurs */}
        <div className="influencers-grid">
          {sortedInfluencers.map(influencer => {
            const totalFollowers = getTotalFollowers(influencer);
            const avgEngagement = getAvgEngagement(influencer);
            
            return (
              <div
                key={influencer._id}
                className="influencers-card"
                role="button"
                tabIndex={0}
                onClick={() => openDetailsModal(influencer)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetailsModal(influencer); } }}
              >
                <div className="influencers-card-actions">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openDetailsModal(influencer); }}
                    className="influencers-card-btn influencers-card-btn-view"
                    title={t('influencers.viewDetails')}
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEditInfluencer(influencer); }}
                    className="influencers-card-btn influencers-card-btn-edit"
                    title={t('influencers.edit')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteInfluencer(influencer._id); }}
                    className="influencers-card-btn influencers-card-btn-delete"
                    title={t('influencers.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="influencers-card-header">
                  <div className="influencers-card-avatar" data-initials={getInitials(influencer.name)}>
                    {influencer.avatarUrl ? (
                      <img src={influencer.avatarUrl} alt={influencer.name} />
                    ) : (
                      getInitials(influencer.name)
                    )}
                  </div>
                  <div className="influencers-card-info">
                    <h3 className="influencers-card-name">{influencer.name}</h3>
                    <div className="influencers-card-project">{getProjectName(influencer.projectId)}</div>
                    {influencer.country && (
                      <div className="influencers-card-location">
                        <MapPin size={12} />
                        {influencer.country}{influencer.city ? `, ${influencer.city}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="influencers-card-stats">
                  <div>
                    <div className="influencers-card-stat-label">{t('influencers.followers')}</div>
                    <div className="influencers-card-stat-value">{formatNumber(totalFollowers)}</div>
                  </div>
                  <div>
                    <div className="influencers-card-stat-label">{t('influencers.engagement')}</div>
                    <div className="influencers-card-stat-value influencers-card-stat-value-accent">{avgEngagement.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="influencers-card-stat-label">{t('influencers.postRate')}</div>
                    <div className="influencers-card-stat-value influencers-card-stat-value-success">
                      {influencer.rates?.post ? `${influencer.rates.post}€` : t('influencers.notAvailable')}
                    </div>
                  </div>
                </div>

                {influencer.niches && influencer.niches.length > 0 && (
                  <>
                    <div className="influencers-card-section-title">{t('influencers.niches')}</div>
                    <div className="influencers-card-niches">
                      {influencer.niches.map((niche, idx) => (
                        <span key={idx} className="influencers-card-niche-tag">{niche}</span>
                      ))}
                    </div>
                  </>
                )}

                {(influencer.email || influencer.phone) && (
                  <div className="influencers-card-contact">
                    {influencer.email && (
                      <div className="influencers-card-contact-line" title={influencer.email}>
                        <Mail size={14} />
                        <span>{influencer.email}</span>
                      </div>
                    )}
                    {influencer.phone && (
                      <div className="influencers-card-contact-line" title={influencer.phone}>
                        <Phone size={14} />
                        <span>{influencer.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* État vide */}
        {sortedInfluencers.length === 0 && (
          <div className="influencers-empty">
            <Users size={64} strokeWidth={1} className="influencers-empty-icon" style={{ margin: "0 auto", display: "block" }} />
            <h3 className="influencers-empty-title">{t('influencers.noInfluencers')}</h3>
            <p className="influencers-empty-text">
              {projectFilter === "all" && countryFilter === "all" && !keywordSearch.trim()
                ? t('influencers.noInfluencersDescription')
                : t('influencers.noInfluencersForProject')}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingInfluencer(null);
                setNewInfluencer({
                  projectId: "",
                  name: "",
                  firstName: "",
                  lastName: "",
                  country: "",
                  city: "",
                  targetMarket: "",
                  email: "",
                  phone: "",
                  description: "",
                  descriptionIt: "",
                  avatarUrl: "",
                  platforms: [],
                  niches: [],
                  languages: [],
                  portfolioUrls: [],
                  rates: { story: undefined, post: undefined, reel: undefined, tiktok: undefined, package: undefined, currency: "EUR" },
                  status: "active"
                });
                setShowAddModal(true);
              }}
              className="page-hero-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Plus size={18} strokeWidth={2.5} />
              {t('influencers.addFirstInfluencer')}
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="influencers-modal-overlay" onClick={() => {}}>
          <div className="influencers-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="influencers-modal-title">
              {editingInfluencer ? t('influencers.editInfluencer') : t('influencers.addInfluencer')}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Project */}
              <div>
                <label className="influencers-form-label">
                  {t('influencers.projectRequired')}
                </label>
                <select
                  value={newInfluencer.projectId}
                  onChange={(e) => setNewInfluencer({ ...newInfluencer, projectId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px"
                  }}
                >
                  <option value="">{t('influencers.selectProject')}</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo de profil */}
              <div>
                <label className="influencers-form-label">
                  {t('influencers.profilePhoto')}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {newInfluencer.avatarUrl && (
                      <div className="influencers-form-avatar-preview">
                        <img src={newInfluencer.avatarUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: "none" }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="btn-meta btn-meta-outline"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {uploadingAvatar ? "..." : newInfluencer.avatarUrl ? t('influencers.changePhoto') : t('influencers.uploadImage')}
                      </button>
                      {newInfluencer.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setNewInfluencer({ ...newInfluencer, avatarUrl: "" })}
                          className="btn-meta"
                          style={{ whiteSpace: "nowrap", background: "#fee2e2", color: "#b91c1c", border: "none" }}
                        >
                          {t('influencers.deletePhoto')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* First Name & Last Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.firstNameRequired')}
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.firstName}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, firstName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.firstNamePlaceholder')}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.lastNameRequired')}
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.lastName}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, lastName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.lastNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.email')}
                  </label>
                  <input
                    type="email"
                    value={newInfluencer.email}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.phone')}
                  </label>
                  <input
                    type="tel"
                    value={newInfluencer.phone}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.phonePlaceholder')}
                  />
                </div>
              </div>

              {/* Country & City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.country')}
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.country}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, country: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.countryPlaceholder')}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.city')}
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.city}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, city: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.cityPlaceholder')}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem"
                  }}>
                    {t('influencers.targetMarket')}
                  </label>
                  <input
                    type="text"
                    value={newInfluencer.targetMarket || ""}
                    onChange={(e) => setNewInfluencer({ ...newInfluencer, targetMarket: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                    placeholder={t('influencers.targetMarketPlaceholder')}
                  />
                </div>
              </div>

              {/* Niches */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  🎯 {t('influencers.niches')}
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {(newInfluencer.niches || []).map((niche: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.25rem 0.5rem",
                        background: "#e0f2fe",
                        color: "#0369a1",
                        borderRadius: "6px",
                        fontSize: "0.8125rem"
                      }}
                    >
                      {niche}
                      <button
                        type="button"
                        onClick={() => setNewInfluencer({ ...newInfluencer, niches: newInfluencer.niches.filter((_: string, i: number) => i !== idx) })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                        aria-label={t('influencers.remove')}
                      >
                        <XIcon size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = nicheInput.trim(); if (v) { setNewInfluencer({ ...newInfluencer, niches: [...(newInfluencer.niches || []), v] }); setNicheInput(""); } } }}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "6px"
                    }}
                    placeholder={t('influencers.nichePlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => { const v = nicheInput.trim(); if (v) { setNewInfluencer({ ...newInfluencer, niches: [...(newInfluencer.niches || []), v] }); setNicheInput(""); } }}
                    className="btn-meta btn-meta-outline"
                  >
                    {t('influencers.add')}
                  </button>
                </div>
              </div>

              {/* Languages */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  🗣️ {t('influencers.languages')}
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {(newInfluencer.languages || []).map((lang: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.25rem 0.5rem",
                        background: "#f0fdf4",
                        color: "#166534",
                        borderRadius: "6px",
                        fontSize: "0.8125rem"
                      }}
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => setNewInfluencer({ ...newInfluencer, languages: newInfluencer.languages.filter((_: string, i: number) => i !== idx) })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                        aria-label={t('influencers.remove')}
                      >
                        <XIcon size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = languageInput.trim(); if (v) { setNewInfluencer({ ...newInfluencer, languages: [...(newInfluencer.languages || []), v] }); setLanguageInput(""); } } }}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "6px"
                    }}
                    placeholder={t('influencers.languagePlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => { const v = languageInput.trim(); if (v) { setNewInfluencer({ ...newInfluencer, languages: [...(newInfluencer.languages || []), v] }); setLanguageInput(""); } }}
                    className="btn-meta btn-meta-outline"
                  >
                    {t('influencers.add')}
                  </button>
                </div>
              </div>

              {/* Tarifs */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  💰 {t('influencers.rates')}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "0.25rem" }}>{t('influencers.rateStory')}</label>
                    <input type="number" min={0} step={1} value={newInfluencer.rates?.story ?? ""} onChange={(e) => setNewInfluencer({ ...newInfluencer, rates: { ...newInfluencer.rates, story: e.target.value ? Number(e.target.value) : undefined } })} style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }} placeholder="—" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "0.25rem" }}>{t('influencers.ratePost')}</label>
                    <input type="number" min={0} step={1} value={newInfluencer.rates?.post ?? ""} onChange={(e) => setNewInfluencer({ ...newInfluencer, rates: { ...newInfluencer.rates, post: e.target.value ? Number(e.target.value) : undefined } })} style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }} placeholder="—" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "0.25rem" }}>{t('influencers.rateReel')}</label>
                    <input type="number" min={0} step={1} value={newInfluencer.rates?.reel ?? ""} onChange={(e) => setNewInfluencer({ ...newInfluencer, rates: { ...newInfluencer.rates, reel: e.target.value ? Number(e.target.value) : undefined } })} style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }} placeholder="—" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "0.25rem" }}>{t('influencers.rateTiktok')}</label>
                    <input type="number" min={0} step={1} value={newInfluencer.rates?.tiktok ?? ""} onChange={(e) => setNewInfluencer({ ...newInfluencer, rates: { ...newInfluencer.rates, tiktok: e.target.value ? Number(e.target.value) : undefined } })} style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }} placeholder="—" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "0.25rem" }}>{t('influencers.ratePackage')}</label>
                    <input type="number" min={0} step={1} value={newInfluencer.rates?.package ?? ""} onChange={(e) => setNewInfluencer({ ...newInfluencer, rates: { ...newInfluencer.rates, package: e.target.value ? Number(e.target.value) : undefined } })} style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }} placeholder="—" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "0.25rem" }}>{t('influencers.currency')}</label>
                    <select value={newInfluencer.rates?.currency || "EUR"} onChange={(e) => setNewInfluencer({ ...newInfluencer, rates: { ...newInfluencer.rates, currency: e.target.value } })} style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Portfolio URLs */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  🎨 {t('influencers.portfolioUrls')}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {(newInfluencer.portfolioUrls || []).map((url: string, idx: number) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.8125rem", color: "#6366f1", wordBreak: "break-all" }}>{url}</a>
                      <button type="button" onClick={() => setNewInfluencer({ ...newInfluencer, portfolioUrls: newInfluencer.portfolioUrls.filter((_: string, i: number) => i !== idx) })} style={{ padding: "0.25rem", background: "#fee", color: "#e11d48", border: "none", borderRadius: "4px", cursor: "pointer" }}><XIcon size={14} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    value={portfolioUrlInput}
                    onChange={(e) => setPortfolioUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = portfolioUrlInput.trim(); if (v) { setNewInfluencer({ ...newInfluencer, portfolioUrls: [...(newInfluencer.portfolioUrls || []), v] }); setPortfolioUrlInput(""); } } }}
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "6px" }}
                    placeholder={t('influencers.portfolioUrlPlaceholder')}
                  />
                  <button type="button" onClick={() => { const v = portfolioUrlInput.trim(); if (v) { setNewInfluencer({ ...newInfluencer, portfolioUrls: [...(newInfluencer.portfolioUrls || []), v] }); setPortfolioUrlInput(""); } }} className="btn-meta btn-meta-outline">{t('influencers.add')}</button>
                </div>
              </div>

              {/* Statut */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  {t('influencers.status')}
                </label>
                <select
                  value={newInfluencer.status || "active"}
                  onChange={(e) => setNewInfluencer({ ...newInfluencer, status: e.target.value })}
                  style={{ width: "100%", padding: "0.625rem", fontSize: "0.875rem", border: "2px solid #e5e5e5", borderRadius: "8px" }}
                >
                  <option value="active">{t('influencers.statusActive')}</option>
                  <option value="pending">{t('influencers.statusPending')}</option>
                  <option value="inactive">{t('influencers.statusInactive')}</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  {t('influencers.description')}
                </label>
                <textarea
                  value={newInfluencer.description}
                  onChange={(e) => setNewInfluencer({ ...newInfluencer, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('influencers.descriptionPlaceholder')}
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
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  {t('influencers.descriptionIt')}
                </label>
                <textarea
                  value={newInfluencer.descriptionIt}
                  onChange={(e) => setNewInfluencer({ ...newInfluencer, descriptionIt: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('influencers.descriptionItPlaceholder')}
                />
              </div>

              {/* Platform URLs */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem"
                }}>
                  {t('influencers.platformUrls')} {!canAutoCollect && "(Saisie manuelle)"}
                </label>
                
                {/* Added Platforms */}
                {newInfluencer.platforms.length > 0 && (
                  <div style={{ marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {newInfluencer.platforms.map((platform: any, index: number) => (
                      <div 
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.625rem",
                          background: "#f8f9fa",
                          borderRadius: "6px",
                          fontSize: "0.875rem"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                          <span>{networkIcons[platform.network] || "🌐"}</span>
                          <span style={{ fontWeight: "600" }}>{platform.network}</span>
                          <span style={{ color: "#666" }}>@{platform.handle}</span>
                          <span style={{ color: "#6366f1", fontWeight: "600" }}>
                            {formatNumber(platform.followers ?? 0)} Followers
                          </span>
                          <span style={{ color: "#10b981", fontWeight: "600" }}>
                            {(platform.avgEngagementRate ?? 0)}% Engagement
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => {
                              setSelectedPlatform(platform.network);
                              setManualMode(true);
                              setManualData({
                                handle: platform.handle || "",
                                followers: platform.followers?.toString() || "",
                                engagement: platform.avgEngagementRate?.toString() || "",
                                avgViews: platform.avgViews?.toString() || ""
                              });
                              setPlatformUrl(platform.url || "");
                              setEditingPlatformIndex(index);
                            }}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "600"
                            }}
                          >
                            {t('influencers.editPlatform')}
                          </button>
                          <button
                          onClick={() => removePlatform(index)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            background: "#fee",
                            color: "#e11d48",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "600"
                          }}
                        >
                          {t('influencers.remove')}
                        </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Platform Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => {
                        const newPlatform = e.target.value;
                        setSelectedPlatform(newPlatform);
                        // Auto-enable manual mode for platforms without auto collection
                        const platformsWithAuto = ['youtube'];
                        setManualMode(!platformsWithAuto.includes(newPlatform));
                        setPlatformUrl("");
                        setManualData({ handle: "", followers: "", engagement: "", avgViews: "" });
                        setEditingPlatformIndex(null);
                      }}
                      style={{
                        padding: "0.625rem",
                        fontSize: "0.875rem",
                        border: "2px solid #e5e5e5",
                        borderRadius: "8px",
                        width: "140px"
                      }}
                    >
                      <option value="instagram">📷 Instagram</option>
                      <option value="tiktok">🎵 TikTok</option>
                      <option value="facebook">📘 Facebook</option>
                      <option value="youtube">▶️ YouTube</option>
                      <option value="x">𝕏 X</option>
                      <option value="snapchat">👻 Snapchat</option>
                      <option value="linkedin">💼 LinkedIn</option>
                      <option value="threads">🧵 Threads</option>
                    </select>
                    
                    {canAutoCollect && (
                      <button
                        onClick={() => setManualMode(!manualMode)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: manualMode ? "#e5e5e5" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: manualMode ? "#666" : "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {manualMode ? "🔄 Auto" : "✏️ Manuel"}
                      </button>
                    )}
                  </div>

                  {manualMode || !canAutoCollect ? (
                    /* Manual Entry Mode */
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                            {t('influencers.handle')} *
                          </label>
                          <p style={{ fontSize: "0.7rem", color: "#888", marginBottom: "0.25rem" }}>{t('influencers.handleHint')}</p>
                          <input
                            type="text"
                            value={manualData.handle}
                            onChange={(e) => setManualData({ ...manualData, handle: e.target.value })}
                            placeholder={t('influencers.handleHint')}
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              fontSize: "0.875rem",
                              border: "2px solid #e5e5e5",
                              borderRadius: "6px"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                            {t('influencers.followers')}
                          </label>
                          <input
                            type="number"
                            value={manualData.followers}
                            onChange={(e) => setManualData({ ...manualData, followers: e.target.value })}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              fontSize: "0.875rem",
                              border: "2px solid #e5e5e5",
                              borderRadius: "6px"
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                            {t('influencers.engagement')} (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={manualData.engagement}
                            onChange={(e) => setManualData({ ...manualData, engagement: e.target.value })}
                            placeholder="0.0"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              fontSize: "0.875rem",
                              border: "2px solid #e5e5e5",
                              borderRadius: "6px"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                            {t('influencers.avgViews')}
                          </label>
                          <input
                            type="number"
                            value={manualData.avgViews}
                            onChange={(e) => setManualData({ ...manualData, avgViews: e.target.value })}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              fontSize: "0.875rem",
                              border: "2px solid #e5e5e5",
                              borderRadius: "6px"
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                          {t('influencers.urlOptional')}
                        </label>
                        <input
                          type="text"
                          value={platformUrl}
                          onChange={(e) => setPlatformUrl(e.target.value)}
                          placeholder={t('influencers.urlOptionalPlaceholder')}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            fontSize: "0.875rem",
                            border: "2px solid #e5e5e5",
                            borderRadius: "6px"
                          }}
                        />
                      </div>
                      <button
                        onClick={addPlatformManually}
                        disabled={!manualData.handle}
                        style={{
                          padding: "0.625rem 1rem",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          background: !manualData.handle ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: !manualData.handle ? "not-allowed" : "pointer"
                        }}
                      >
                        {editingPlatformIndex !== null ? t('influencers.updatePlatform') : t('influencers.addPlatform')}
                      </button>
                    </div>
                  ) : (
                    /* Automatic Collection Mode */
                    <>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          value={platformUrl}
                          onChange={(e) => setPlatformUrl(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "0.625rem",
                            fontSize: "0.875rem",
                            border: "2px solid #e5e5e5",
                            borderRadius: "8px"
                          }}
                          placeholder={t('influencers.platformUrlPlaceholder')}
                        />
                        <button
                          onClick={() => {
                            if (platformUrl) {
                              collectPlatformData(selectedPlatform, platformUrl);
                            }
                          }}
                          disabled={!platformUrl || isCollecting}
                          style={{
                            padding: "0.625rem 1rem",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            background: isCollecting ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: isCollecting ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {isCollecting ? t('influencers.collecting') : t('influencers.collect')}
                        </button>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>
                        {t('influencers.platformTip')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="influencers-modal-actions">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingInfluencer(null);
                  setNewInfluencer({
                    projectId: "",
                    name: "",
                    firstName: "",
                    lastName: "",
                    country: "",
                    city: "",
                    targetMarket: "",
                    email: "",
                    phone: "",
                    description: "",
                    descriptionIt: "",
                    avatarUrl: "",
                    platforms: [],
                    niches: [],
                    languages: [],
                    portfolioUrls: [],
                    rates: { story: undefined, post: undefined, reel: undefined, tiktok: undefined, package: undefined, currency: "EUR" },
                    status: "active"
                  });
                }}
                className="btn-meta btn-meta-secondary"
                style={{ flex: 1 }}
              >
                {t('influencers.cancel')}
              </button>
              <button
                onClick={editingInfluencer ? handleUpdateInfluencer : handleAddInfluencer}
                className="btn-meta btn-meta-primary"
                style={{ flex: 1 }}
                disabled={!newInfluencer.projectId || (!newInfluencer.firstName && !newInfluencer.lastName)}
              >
                {editingInfluencer ? t('influencers.update') : t('influencers.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - Style Meta Moderne */}
      {showDetailsModal && selectedInfluencerDetails ? (
        <div className="influencers-detail-overlay" onClick={closeDetailsModal}>
          <div className="influencers-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="influencers-detail-toolbar">
              <button
                type="button"
                onClick={() => {
                  closeDetailsModal();
                  handleEditInfluencer(selectedInfluencerDetails);
                }}
                className="influencers-detail-toolbar-btn influencers-detail-toolbar-btn-edit"
                title={t('influencers.edit')}
              >
                <Edit2 size={18} strokeWidth={2.5} />
                {t('influencers.edit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('influencers.deleteConfirm'))) {
                    handleDeleteInfluencer(selectedInfluencerDetails._id);
                    closeDetailsModal();
                  }
                }}
                className="influencers-detail-toolbar-btn influencers-detail-toolbar-btn-delete"
                title={t('influencers.delete')}
              >
                <Trash2 size={18} strokeWidth={2.5} />
                {t('influencers.delete')}
              </button>
              <button
                type="button"
                onClick={closeDetailsModal}
                className="influencers-detail-close"
                aria-label={t('common.close')}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="influencers-detail-header">
              <div className="influencers-detail-avatar">
                {selectedInfluencerDetails.avatarUrl ? (
                  <img src={selectedInfluencerDetails.avatarUrl} alt={selectedInfluencerDetails.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--border-radius-xl)" }} />
                ) : (
                  selectedInfluencerDetails.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="influencers-detail-meta">
                <h2 className="influencers-detail-name">{selectedInfluencerDetails.name}</h2>
                <div className="influencers-detail-badges">
                  <span className="influencers-detail-badge">
                    💼 {getProjectName(selectedInfluencerDetails.projectId)}
                  </span>
                  {selectedInfluencerDetails.country && (
                    <span className="influencers-detail-badge">
                      <MapPin size={14} />
                      {selectedInfluencerDetails.country}{selectedInfluencerDetails.city ? `, ${selectedInfluencerDetails.city}` : ""}
                    </span>
                  )}
                  {(selectedInfluencerDetails as any).targetMarket && (
                    <span className="influencers-detail-badge">
                      🎯 {(selectedInfluencerDetails as any).targetMarket}
                    </span>
                  )}
                </div>
                <div className="influencers-detail-stats">
                  <div>
                    <div className="influencers-detail-stat-label">{t('influencers.followers')}</div>
                    <div className="influencers-detail-stat-value">
                      {formatNumber(getTotalFollowers(selectedInfluencerDetails))}
                    </div>
                  </div>
                  <div>
                    <div className="influencers-detail-stat-label">{t('influencers.engagement')}</div>
                    <div className={getAvgEngagement(selectedInfluencerDetails) > 0 ? "influencers-detail-stat-value" : "influencers-detail-stat-value influencers-detail-stat-value-muted"}>
                      {getAvgEngagement(selectedInfluencerDetails) > 0 ? `${getAvgEngagement(selectedInfluencerDetails).toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="influencers-detail-stat-label">{t('influencers.postRate')}</div>
                    <div className={selectedInfluencerDetails.rates?.post ? "influencers-detail-stat-value" : "influencers-detail-stat-value influencers-detail-stat-value-muted"}>
                      {selectedInfluencerDetails.rates?.post ? `${selectedInfluencerDetails.rates.post}€` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {getDisplayNotesInfluencer(selectedInfluencerDetails, language) && (
              <div className="influencers-detail-section">
                <div className="influencers-detail-description-box">
                  <div className="influencers-detail-description-label">📝 {t('influencers.description')}</div>
                  <p className="influencers-detail-description-text">{getDisplayNotesInfluencer(selectedInfluencerDetails, language)}</p>
                </div>
              </div>
            )}

            {selectedInfluencerDetails.platforms && selectedInfluencerDetails.platforms.length > 0 && (
              <div className="influencers-detail-section">
                <h3 className="influencers-detail-section-title">{t('influencers.platforms')}</h3>
                <div className="influencers-detail-platforms-grid">
                  {selectedInfluencerDetails.platforms.map((platform, idx) => (
                    <div key={idx} className="influencers-detail-platform-card">
                      <div className="influencers-detail-platform-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                          <span style={{ fontSize: "var(--font-size-xl)" }}>
                            {networkIcons[platform.network] || "🌐"}
                          </span>
                          <div>
                            <div style={{ 
                              fontSize: "var(--font-size-base)", 
                              fontWeight: "var(--font-weight-semibold)",
                              color: "var(--color-text-primary)"
                            }}>
                              {platform.network}
                            </div>
                            {platform.handle && (
                              <div style={{ 
                                fontSize: "var(--font-size-sm)", 
                                color: "var(--color-text-secondary)"
                              }}>
                                @{platform.handle}
                              </div>
                            )}
                          </div>
                        </div>
                        {platform.url && (
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-meta btn-meta-ghost"
                            style={{
                              padding: "var(--spacing-2)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                            title={platform.url}
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(3, 1fr)", 
                        gap: "var(--spacing-3)"
                      }}>
                        <div>
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "var(--spacing-1)" }}>
                            {t('influencers.followers')}
                          </div>
                          <div style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                            {platform.followers != null && platform.followers > 0 ? formatNumber(platform.followers) : "—"}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "var(--spacing-1)" }}>
                            {t('influencers.engagement')}
                          </div>
                          <div style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-success)" }}>
                            {platform.avgEngagementRate != null && platform.avgEngagementRate > 0 ? `${platform.avgEngagementRate.toFixed(1)}%` : "—"}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "var(--spacing-1)" }}>
                            {t('influencers.avgViews')}
                          </div>
                          <div style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                            {platform.avgViews != null && platform.avgViews > 0 ? formatNumber(platform.avgViews) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Info Grid */}
            <div className="influencers-detail-info-cards" style={{ marginBottom: "var(--spacing-8)" }}>
              <div className="influencers-detail-info-card">
                <h4 className="influencers-detail-info-card-title">📞 {t('influencers.contact')}</h4>
                {canSeeInfluencerContact() ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                  {selectedInfluencerDetails.email && (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "var(--spacing-2)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-primary)"
                    }}>
                      <span>📧</span>
                      <a 
                        href={`mailto:${selectedInfluencerDetails.email}`}
                        style={{ 
                          color: "var(--color-primary)",
                          textDecoration: "none"
                        }}
                      >
                        {selectedInfluencerDetails.email}
                      </a>
                    </div>
                  )}
                  {selectedInfluencerDetails.phone && (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "var(--spacing-2)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-primary)"
                    }}>
                      <span>📱</span>
                      <a 
                        href={`tel:${selectedInfluencerDetails.phone}`}
                        style={{ 
                          color: "var(--color-primary)",
                          textDecoration: "none"
                        }}
                      >
                        {selectedInfluencerDetails.phone}
                      </a>
                    </div>
                  )}
                  {!selectedInfluencerDetails.email && !selectedInfluencerDetails.phone && (
                    <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", fontStyle: "italic", margin: 0 }}>
                      {t('influencers.noContactInfo')}
                    </p>
                  )}
              </div>
                ) : (
                  <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", fontStyle: "italic", margin: 0 }}>
                    {t('influencers.contactNoPermission') || "Vous n'avez pas la permission de voir les coordonnées."}
                  </p>
                )}
              </div>

              <div className="influencers-detail-info-card">
                <h4 className="influencers-detail-info-card-title">
                  ℹ️ {t('influencers.additionalInfo')}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                  {selectedInfluencerDetails.languages?.length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: "var(--font-size-xs)", 
                        color: "var(--color-text-tertiary)",
                        marginBottom: "var(--spacing-1)"
                      }}>
                        🗣️ {t('influencers.languages')}
                      </div>
                      <div style={{ 
                        display: "flex", 
                        flexWrap: "wrap", 
                        gap: "var(--spacing-2)"
                      }}>
                        {selectedInfluencerDetails.languages.map((lang, idx) => (
                          <span 
                            key={idx}
                            className="badge-meta badge-meta-outline"
                            style={{ fontSize: "var(--font-size-xs)" }}
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedInfluencerDetails.niches?.length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: "var(--font-size-xs)", 
                        color: "var(--color-text-tertiary)",
                        marginBottom: "var(--spacing-1)"
                      }}>
                        🎯 {t('influencers.niches')}
                      </div>
                      <div style={{ 
                        display: "flex", 
                        flexWrap: "wrap", 
                        gap: "var(--spacing-2)"
                      }}>
                        {selectedInfluencerDetails.niches.map((niche, idx) => (
                          <span 
                            key={idx}
                            className="badge-meta badge-meta-primary"
                            style={{ fontSize: "var(--font-size-xs)" }}
                          >
                            {niche}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* Rates Section */}
            {selectedInfluencerDetails.rates && Object.keys(selectedInfluencerDetails.rates).filter(k => k !== 'currency' && selectedInfluencerDetails.rates?.[k as keyof typeof selectedInfluencerDetails.rates]).length > 0 && (
              <div style={{ marginBottom: "var(--spacing-8)" }}>
                <h3 style={{ 
                  fontSize: "var(--font-size-lg)", 
                  fontWeight: "var(--font-weight-bold)", 
                  marginBottom: "var(--spacing-4)",
                  color: "var(--color-text-primary)"
                }}>
                  💰 {t('influencers.rates') || 'Tarifs'}
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
                  gap: "var(--spacing-3)"
                }}>
                  {Object.entries(selectedInfluencerDetails.rates).map(([key, value]) => {
                    if (key === 'currency' || !value) return null;
                    const labels: Record<string, string> = {
                      story: 'Story',
                      post: 'Post',
                      reel: 'Reel',
                      tiktok: 'TikTok',
                      package: 'Package'
                    };
                    return (
                      <div 
                        key={key}
                        className="card-meta"
                        style={{
                          padding: "var(--spacing-4)",
                          textAlign: "center"
                        }}
                      >
                        <div style={{ 
                          fontSize: "var(--font-size-xs)", 
                          color: "var(--color-text-tertiary)",
                          marginBottom: "var(--spacing-2)"
                        }}>
                          {labels[key] || key}
                        </div>
                        <div style={{ 
                          fontSize: "var(--font-size-xl)", 
                          fontWeight: "var(--font-weight-bold)",
                          color: "var(--color-primary)"
                        }}>
                          {value}{selectedInfluencerDetails.rates?.currency || '€'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portfolio URLs */}
            {selectedInfluencerDetails.portfolioUrls && selectedInfluencerDetails.portfolioUrls.length > 0 && (
              <div>
                <h3 style={{ 
                  fontSize: "var(--font-size-lg)", 
                  fontWeight: "var(--font-weight-bold)", 
                  marginBottom: "var(--spacing-4)",
                  color: "var(--color-text-primary)"
                }}>
                  🎨 {t('influencers.portfolioUrls')}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {selectedInfluencerDetails.portfolioUrls.map((url, idx) => (
                      <a
                      key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      className="btn-meta btn-meta-outline"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-2)",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        wordBreak: "break-all"
                      }}
                    >
                      <ExternalLink size={16} />
                        {url}
                      </a>
                  ))}
              </div>
              </div>
            )}

        </div>
      ) : null}
    </div>
  );
}
