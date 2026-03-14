import { useEffect, useState } from "react";
import axios from "axios";
import { 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock,
  Award,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Instagram,
  Facebook,
  Music,
  Users,
  Bookmark,
  Calendar,
  LayoutGrid,
  Smartphone,
  UserCircle,
  FileBarChart,
  Filter,
  DollarSign
} from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import { networkColors } from "@/lib/networkConfig";

type Post = {
  _id: string;
  projectId: string;
  projectIds?: string[];
  networks: string[];
  network?: string;
  type: string;
  caption: string;
  scheduledAt: string;
  publishedAt?: string;
  status: string;
  insights?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagement_rate?: number;
  };
  multiPlatformStats?: Array<{
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
};

type Collaboration = {
  _id: string;
  projectId: string;
  projectIds?: string[];
  influencerId?: string;
  budget?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  scheduledAt?: string;
  platforms?: string[];
  contentUploads?: Array<{
    uploadedAt: string;
    publishedAt?: string;
    platform?: string;
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
};

export default function StatsPage() {
  const { t } = useTranslation();
  const { canSeeBudgetAndTarifs } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const defaultEnd = new Date();
  const [dateStart, setDateStart] = useState<string>("2025-01-01");
  const [dateEnd, setDateEnd] = useState<string>(() => defaultEnd.toISOString().slice(0, 10));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsRes, collabsRes, projectsRes, influencersRes] = await Promise.all([
        axios.get("/api/posts"),
        axios.get("/api/collaborations"),
        axios.get("/api/projects"),
        axios.get("/api/influencers")
      ]);
      
      // Only published posts with statistics
      const publishedPosts = (postsRes.data.posts || []).filter((p: Post) => 
        p.status === "PUBLISHED" && (
          p.insights || 
          (p.multiPlatformStats && p.multiPlatformStats.length > 0)
        )
      );
      setPosts(publishedPosts);
      setCollaborations(collabsRes.data.collaborations || []);
      setProjects(projectsRes.data.projects || []);
      setInfluencers(influencersRes.data.influencers || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all social accounts from projects
  const getAllSocialAccounts = () => {
    const accounts: Array<{
      projectId: string;
      projectName: string;
      network: string;
      accountName?: string;
      pageName?: string;
      pageId?: string;
      accountId?: string;
      isActive: boolean;
    }> = [];

    projects.forEach(project => {
      if (project.socialAccounts && project.socialAccounts.length > 0) {
        project.socialAccounts.forEach((account: any) => {
          if (account.isActive) {
            accounts.push({
              projectId: project._id,
              projectName: project.name,
              network: account.network,
              accountName: account.accountName,
              pageName: account.pageName,
              pageId: account.pageId,
              accountId: account.accountId,
              isActive: account.isActive
            });
          }
        });
      }
    });

    return accounts;
  };

  const getProjectName = (id: string) => {
    const project = projects.find(p => p._id === id);
    return project?.name || "Inconnu";
  };

  const getInfluencerName = (id: string) => {
    const influencer = influencers.find((inf: any) => inf._id === id);
    return influencer?.name || "Inconnu";
  };

  // Helper to get date range filter (start and end of day)
  const getDateRangeFilter = () => {
    const start = dateStart ? new Date(dateStart + "T00:00:00") : null;
    const end = dateEnd ? new Date(dateEnd + "T23:59:59.999") : null;
    return { start, end };
  };

  // Extract all statistics from posts (including multiPlatformStats)
  const extractPostStats = (post: Post): Array<{
    platform: string;
    publishedAt?: string;
    insights?: any;
    sentiment?: string;
  }> => {
    const stats: Array<{
      platform: string;
      publishedAt?: string;
      insights?: any;
      sentiment?: string;
    }> = [];

    // Add main insights if exists
    if (post.insights) {
      const networks = post.networks || (post.network ? [post.network] : []);
      networks.forEach(network => {
        stats.push({
          platform: network,
          publishedAt: post.publishedAt,
          insights: post.insights,
          sentiment: (post as any).sentiment
        });
      });
    }

    // Add multiPlatformStats
    if (post.multiPlatformStats && post.multiPlatformStats.length > 0) {
      post.multiPlatformStats.forEach(stat => {
        if (stat.insights) {
          stats.push({
            platform: stat.platform,
            publishedAt: stat.publishedAt || post.publishedAt,
            insights: stat.insights,
            sentiment: stat.sentiment
          });
        }
      });
    }

    return stats;
  };

  // Extract all statistics from collaborations
  const extractCollabStats = (collab: Collaboration): Array<{
    platform: string;
    publishedAt?: string;
    insights?: any;
    sentiment?: string;
  }> => {
    const stats: Array<{
      platform: string;
      publishedAt?: string;
      insights?: any;
      sentiment?: string;
    }> = [];

    if (!collab.contentUploads) return stats;

    collab.contentUploads.forEach(upload => {
      // Add main insights if exists
      if (upload.insights && upload.publishedAt && upload.platform) {
        stats.push({
          platform: upload.platform,
          publishedAt: upload.publishedAt,
          insights: upload.insights,
          sentiment: upload.sentiment
        });
      }

      // Add platformStats (multi-platform)
      if (upload.platformStats && upload.platformStats.length > 0) {
        upload.platformStats.forEach(stat => {
          if (stat.insights) {
            stats.push({
              platform: stat.platform,
              publishedAt: stat.publishedAt || upload.publishedAt,
              insights: stat.insights,
              sentiment: stat.sentiment
            });
          }
        });
      }
    });

    return stats;
  };

  // Apply filters
  const filteredPosts = posts.filter(post => {
    const matchesProject = selectedProject === "all" || 
      post.projectId === selectedProject ||
      (post.projectIds && post.projectIds.includes(selectedProject));
    
    const postStats = extractPostStats(post);
    const matchesPlatform = selectedPlatform === "all" || 
      postStats.some(stat => stat.platform === selectedPlatform);
    
    const matchesType = selectedType === "all" || post.type === selectedType;
    
    const { start: rangeStart, end: rangeEnd } = getDateRangeFilter();
    const matchesDate = (() => {
      if (postStats.length === 0) return true;
      const hasAnyDate = postStats.some(s => s.publishedAt);
      if (!hasAnyDate) return true;
      if (!rangeStart && !rangeEnd) return true;
      return postStats.some(s => {
        if (!s.publishedAt) return false;
        const d = new Date(s.publishedAt);
        if (rangeStart && d < rangeStart) return false;
        if (rangeEnd && d > rangeEnd) return false;
        return true;
      });
    })();
    
    return matchesProject && matchesPlatform && matchesType && matchesDate;
  });

  const filteredCollabs = collaborations.filter(collab => {
    const matchesProject = selectedProject === "all" || 
      collab.projectId === selectedProject ||
      (collab.projectIds && collab.projectIds.includes(selectedProject));
    
    const collabStats = extractCollabStats(collab);
    const matchesPlatform = selectedPlatform === "all" || 
      collabStats.some(stat => stat.platform === selectedPlatform);
    
    const { start: rangeStart, end: rangeEnd } = getDateRangeFilter();
    const matchesDate = (() => {
      if (collabStats.length === 0) return false;
      const hasAnyDate = collabStats.some(s => s.publishedAt);
      if (!hasAnyDate) return false;
      if (!rangeStart && !rangeEnd) return true;
      return collabStats.some(s => {
        if (!s.publishedAt) return false;
        const d = new Date(s.publishedAt);
        if (rangeStart && d < rangeStart) return false;
        if (rangeEnd && d > rangeEnd) return false;
        return true;
      });
    })();
    
    return matchesProject && matchesPlatform && matchesDate;
  });

  // Budget : toutes les collabs (draft, révision, planifiées, publiées) dont la date de début est dans la période
  const collabsForBudget = collaborations.filter(collab => {
    const matchesProject = selectedProject === "all" || 
      collab.projectId === selectedProject ||
      (collab.projectIds && collab.projectIds.includes(selectedProject));
    
    const collabStats = extractCollabStats(collab);
    const matchesPlatform = selectedPlatform === "all" || 
      collabStats.some(stat => stat.platform === selectedPlatform) ||
      (collab.platforms && collab.platforms.length > 0 && collab.platforms.includes(selectedPlatform));
    
    const { start: rangeStart, end: rangeEnd } = getDateRangeFilter();
    if (!collab.startDate) return false;
    const startD = new Date(collab.startDate);
    if (isNaN(startD.getTime())) return false;
    const startInRange = (!rangeStart || startD >= rangeStart) && (!rangeEnd || startD <= rangeEnd);
    
    return matchesProject && matchesPlatform && startInRange;
  });

  // Collect all statistics
  const allStats: Array<{
    platform: string;
    publishedAt?: string;
    insights?: any;
    sentiment?: string;
    source: "post" | "collab";
    sourceId: string;
  }> = [];

  filteredPosts.forEach(post => {
    const postStats = extractPostStats(post);
    postStats.forEach(stat => {
      if (stat.insights) {
        allStats.push({
          ...stat,
          source: "post",
          sourceId: post._id
        });
      }
    });
  });

  filteredCollabs.forEach(collab => {
    const collabStats = extractCollabStats(collab);
    collabStats.forEach(stat => {
      if (stat.insights) {
        allStats.push({
          ...stat,
          source: "collab",
          sourceId: collab._id
        });
      }
    });
  });

  // Calculate global statistics
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let engagementRateSum = 0;
  let engagementRateCount = 0;
  let totalContents = 0;

  allStats.forEach(stat => {
    if (stat.insights) {
      totalViews += stat.insights.views || 0;
      totalLikes += stat.insights.likes || 0;
      totalComments += stat.insights.comments || 0;
      totalShares += stat.insights.shares || 0;
      totalSaves += stat.insights.saves || 0;
      if (typeof stat.insights.engagement_rate === "number") {
        engagementRateSum += stat.insights.engagement_rate;
        engagementRateCount += 1;
      }
      totalContents += 1;
    }
  });

  const averageEngagementRate = engagementRateCount > 0 
    ? (engagementRateSum / engagementRateCount).toFixed(2) 
    : "0.00";

  const totalBudget = collabsForBudget.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

  // Calculate best performing content
  const bestContent = allStats.reduce((best, stat) => {
    const currentER = stat.insights?.engagement_rate || 0;
    const bestER = best.insights?.engagement_rate || 0;
    return currentER > bestER ? stat : best;
  }, allStats[0] || null);

  // Calculate best hours based on actual published dates
  const hourStats: Record<string, { engagement: number; count: number }> = {};
  allStats.forEach(stat => {
    if (stat.publishedAt) {
      const date = new Date(stat.publishedAt);
      const hour = date.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!hourStats[hourKey]) {
        hourStats[hourKey] = { engagement: 0, count: 0 };
      }
      
      const engagement = (stat.insights?.views || 0) + 
                        (stat.insights?.likes || 0) * 2 + 
                        (stat.insights?.comments || 0) * 3 + 
                        (stat.insights?.shares || 0) * 4;
      
      hourStats[hourKey].engagement += engagement;
      hourStats[hourKey].count += 1;
    }
  });

  const bestHours = Object.entries(hourStats)
    .map(([hour, data]) => ({
      hour,
      engagement: data.engagement,
      posts: data.count
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // Calculate sentiment analysis from actual data
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  allStats.forEach(stat => {
    if (stat.sentiment) {
      sentimentCounts[stat.sentiment as keyof typeof sentimentCounts] += 1;
    } else {
      sentimentCounts.neutral += 1;
    }
  });

  const totalSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const sentiment = totalSentiment > 0 ? {
    positive: Math.round((sentimentCounts.positive / totalSentiment) * 100),
    neutral: Math.round((sentimentCounts.neutral / totalSentiment) * 100),
    negative: Math.round((sentimentCounts.negative / totalSentiment) * 100)
  } : { positive: 0, neutral: 0, negative: 0 };

  // Platform distribution (with sentiment)
  type PlatformAccumulator = {
    contents: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRateSum: number;
    engagementRateCount: number;
    sentimentPositive: number;
    sentimentNeutral: number;
    sentimentNegative: number;
  };

  const platformStats: Record<string, PlatformAccumulator> = {};

  allStats.forEach(stat => {
    if (!platformStats[stat.platform]) {
      platformStats[stat.platform] = {
        contents: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        engagementRateSum: 0,
        engagementRateCount: 0,
        sentimentPositive: 0,
        sentimentNeutral: 0,
        sentimentNegative: 0
      };
    }

    const entry = platformStats[stat.platform];
    entry.contents += 1;
    entry.views += stat.insights?.views || 0;
    entry.likes += stat.insights?.likes || 0;
    entry.comments += stat.insights?.comments || 0;
    entry.shares += stat.insights?.shares || 0;
    entry.saves += stat.insights?.saves || 0;
    if (typeof stat.insights?.engagement_rate === "number") {
      entry.engagementRateSum += stat.insights.engagement_rate;
      entry.engagementRateCount += 1;
    }
    if (stat.sentiment === "positive") entry.sentimentPositive += 1;
    else if (stat.sentiment === "negative") entry.sentimentNegative += 1;
    else entry.sentimentNeutral += 1;
  });

  const platformStatsArray = Object.entries(platformStats).map(([platform, stats]) => {
    const engagementRate = stats.engagementRateCount > 0 
      ? stats.engagementRateSum / stats.engagementRateCount 
      : 0;
    const totalS = stats.sentimentPositive + stats.sentimentNeutral + stats.sentimentNegative;
    const sentimentPct = totalS > 0 ? {
      positive: Math.round((stats.sentimentPositive / totalS) * 100),
      neutral: Math.round((stats.sentimentNeutral / totalS) * 100),
      negative: Math.round((stats.sentimentNegative / totalS) * 100)
    } : { positive: 0, neutral: 0, negative: 0 };
    return {
      platform,
      contents: stats.contents,
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
      shares: stats.shares,
      saves: stats.saves,
      engagementRate,
      sentiment: sentimentPct
    };
  }).sort((a, b) => b.views - a.views);

  // Social Accounts/Pages Statistics
  const socialAccounts = getAllSocialAccounts();
  
  // Calculate stats per social account/page
  type SocialAccountStats = {
    projectId: string;
    projectName: string;
    network: string;
    accountName?: string;
    pageName?: string;
    pageId?: string;
    accountId?: string;
    contents: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRateSum: number;
    engagementRateCount: number;
  };

  const socialAccountStatsMap: Record<string, SocialAccountStats> = {};

  socialAccounts.forEach(account => {
    const key = `${account.network}-${account.pageId || account.accountId || account.pageName || account.accountName || 'default'}`;
    
    if (!socialAccountStatsMap[key]) {
      socialAccountStatsMap[key] = {
        projectId: account.projectId,
        projectName: account.projectName,
        network: account.network,
        accountName: account.accountName,
        pageName: account.pageName,
        pageId: account.pageId,
        accountId: account.accountId,
        contents: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        engagementRateSum: 0,
        engagementRateCount: 0
      };
    }

    // Find stats for this account/page by matching project and platform
    allStats.forEach(stat => {
      const post = filteredPosts.find(p => p._id === stat.sourceId);
      const collab = filteredCollabs.find(c => c._id === stat.sourceId);
      
      const statProjectId = post 
        ? (post.projectIds && post.projectIds.length > 0 ? post.projectIds[0] : post.projectId)
        : (collab 
          ? (collab.projectIds && collab.projectIds.length > 0 ? collab.projectIds[0] : collab.projectId)
          : null);
      
      if (statProjectId === account.projectId && stat.platform === account.network) {
        const entry = socialAccountStatsMap[key];
        entry.contents += 1;
        entry.views += stat.insights?.views || 0;
        entry.likes += stat.insights?.likes || 0;
        entry.comments += stat.insights?.comments || 0;
        entry.shares += stat.insights?.shares || 0;
        entry.saves += stat.insights?.saves || 0;
        if (typeof stat.insights?.engagement_rate === "number") {
          entry.engagementRateSum += stat.insights.engagement_rate;
          entry.engagementRateCount += 1;
        }
      }
    });
  });

  const socialAccountStatsArray = Object.values(socialAccountStatsMap)
    .map(account => ({
      ...account,
      engagementRate: account.engagementRateCount > 0 
        ? account.engagementRateSum / account.engagementRateCount 
        : 0
    }))
    .filter(account => account.contents > 0) // Only show accounts with content
    .sort((a, b) => b.views - a.views);

  // Influencer statistics (with sentiment)
  type InfluencerAccumulator = {
    influencerId: string;
    contents: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRateSum: number;
    engagementRateCount: number;
    platforms: Set<string>;
    sentimentPositive: number;
    sentimentNeutral: number;
    sentimentNegative: number;
  };

  const influencerStatsMap: Record<string, InfluencerAccumulator> = {};

  filteredCollabs.forEach(collab => {
    if (!collab.influencerId) return;
    const entry = influencerStatsMap[collab.influencerId] || {
      influencerId: collab.influencerId,
      contents: 0,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      engagementRateSum: 0,
      engagementRateCount: 0,
      platforms: new Set<string>(),
      sentimentPositive: 0,
      sentimentNeutral: 0,
      sentimentNegative: 0
    };

    const collabStats = extractCollabStats(collab);
    collabStats.forEach(stat => {
      if (stat.insights) {
        entry.contents += 1;
        entry.views += stat.insights.views || 0;
        entry.likes += stat.insights.likes || 0;
        entry.comments += stat.insights.comments || 0;
        entry.shares += stat.insights.shares || 0;
        entry.saves += stat.insights.saves || 0;
        if (typeof stat.insights.engagement_rate === "number") {
          entry.engagementRateSum += stat.insights.engagement_rate;
          entry.engagementRateCount += 1;
        }
        entry.platforms.add(stat.platform);
        if (stat.sentiment === "positive") entry.sentimentPositive += 1;
        else if (stat.sentiment === "negative") entry.sentimentNegative += 1;
        else entry.sentimentNeutral += 1;
      }
    });

    influencerStatsMap[collab.influencerId] = entry;
  });

  const influencerStatsArray = Object.values(influencerStatsMap)
    .map((entry) => {
      const totalS = entry.sentimentPositive + entry.sentimentNeutral + entry.sentimentNegative;
      const sentimentPct = totalS > 0 ? {
        positive: Math.round((entry.sentimentPositive / totalS) * 100),
        neutral: Math.round((entry.sentimentNeutral / totalS) * 100),
        negative: Math.round((entry.sentimentNegative / totalS) * 100)
      } : { positive: 0, neutral: 0, negative: 0 };
      return {
        influencerId: entry.influencerId,
        name: getInfluencerName(entry.influencerId),
        contents: entry.contents,
        views: entry.views,
        likes: entry.likes,
        comments: entry.comments,
        shares: entry.shares,
        saves: entry.saves,
        engagementRate: entry.engagementRateCount > 0 
          ? entry.engagementRateSum / entry.engagementRateCount 
          : 0,
        platforms: Array.from(entry.platforms),
        sentiment: sentimentPct
      };
    })
    .sort((a, b) => b.views - a.views);

  // Type distribution
  const typeStats: Record<string, {
    contents: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRateSum: number;
    engagementRateCount: number;
  }> = {};

  filteredPosts.forEach(post => {
    const postStats = extractPostStats(post);
    postStats.forEach(stat => {
      if (!typeStats[post.type]) {
        typeStats[post.type] = {
          contents: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          engagementRateSum: 0,
          engagementRateCount: 0
        };
      }
      const entry = typeStats[post.type];
      entry.contents += 1;
      entry.views += stat.insights?.views || 0;
      entry.likes += stat.insights?.likes || 0;
      entry.comments += stat.insights?.comments || 0;
      entry.shares += stat.insights?.shares || 0;
      entry.saves += stat.insights?.saves || 0;
      if (typeof stat.insights?.engagement_rate === "number") {
        entry.engagementRateSum += stat.insights.engagement_rate;
        entry.engagementRateCount += 1;
      }
    });
  });

  // Project statistics (with sentiment)
  const projectStats: Record<string, {
    contents: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRateSum: number;
    engagementRateCount: number;
    sentimentPositive: number;
    sentimentNeutral: number;
    sentimentNegative: number;
  }> = {};

  allStats.forEach(stat => {
    const post = filteredPosts.find(p => p._id === stat.sourceId);
    const collab = filteredCollabs.find(c => c._id === stat.sourceId);
    
    const projectIds: string[] = [];
    if (post) {
      if (post.projectIds && post.projectIds.length > 0) {
        projectIds.push(...post.projectIds);
      } else if (post.projectId) {
        projectIds.push(post.projectId);
      }
    } else if (collab) {
      if (collab.projectIds && collab.projectIds.length > 0) {
        projectIds.push(...collab.projectIds);
      } else if (collab.projectId) {
        projectIds.push(collab.projectId);
      }
    }

    projectIds.forEach(projectId => {
      if (!projectStats[projectId]) {
        projectStats[projectId] = {
          contents: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          engagementRateSum: 0,
          engagementRateCount: 0,
          sentimentPositive: 0,
          sentimentNeutral: 0,
          sentimentNegative: 0
        };
      }
      const entry = projectStats[projectId];
      entry.contents += 1;
      entry.views += stat.insights?.views || 0;
      entry.likes += stat.insights?.likes || 0;
      entry.comments += stat.insights?.comments || 0;
      entry.shares += stat.insights?.shares || 0;
      entry.saves += stat.insights?.saves || 0;
      if (typeof stat.insights?.engagement_rate === "number") {
        entry.engagementRateSum += stat.insights.engagement_rate;
        entry.engagementRateCount += 1;
      }
      if (stat.sentiment === "positive") entry.sentimentPositive += 1;
      else if (stat.sentiment === "negative") entry.sentimentNegative += 1;
      else entry.sentimentNeutral += 1;
    });
  });

  const projectStatsArray = Object.entries(projectStats)
    .map(([projectId, stats]) => {
      const totalS = stats.sentimentPositive + stats.sentimentNeutral + stats.sentimentNegative;
      const sentimentPct = totalS > 0 ? {
        positive: Math.round((stats.sentimentPositive / totalS) * 100),
        neutral: Math.round((stats.sentimentNeutral / totalS) * 100),
        negative: Math.round((stats.sentimentNegative / totalS) * 100)
      } : { positive: 0, neutral: 0, negative: 0 };
      return {
        projectId,
        projectName: getProjectName(projectId),
        contents: stats.contents,
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
        saves: stats.saves,
        engagementRate: stats.engagementRateCount > 0 
          ? stats.engagementRateSum / stats.engagementRateCount 
          : 0,
        sentiment: sentimentPct
      };
    })
    .sort((a, b) => b.views - a.views);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const networkIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Music,
    threads: MessageCircle,
    youtube: Music,
    x: MessageCircle,
    linkedin: Users,
    snapchat: MessageCircle
  };

  // networkColors importé depuis @/lib/networkConfig
  if (loading) {
    return (
      <div className="page-container">
        <div className="stats-loading">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content stats-page">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: 'Statistiques' }
                ]} />
              </div>
              <h1 className="page-hero-title">Statistiques</h1>
              <p className="page-hero-subtitle">
                Données des pages connectées
              </p>
            </div>
          </div>
        </div>

        {/* Vue d'ensemble : filtre + KPIs + blocs */}
        <section className="stats-section stats-overview" aria-label="Vue d'ensemble">
          <h2 className="stats-section-title stats-overview-title">
            <LayoutGrid size={20} /> Vue d'ensemble des vues
          </h2>
          <p className="stats-overview-subtitle">
            {totalContents} contenu(s) analysé(s) sur la période
          </p>

          {/* Bloc filtre : Projet, Plateforme, Type, Date début, Date fin */}
          <div className="stats-overview-filters">
            <div className="stats-overview-filters-head">
              <Filter size={16} />
              <span>Filtrer</span>
            </div>
            <div className="stats-overview-filters-grid">
              <div className="stats-filter-group">
                <label className="stats-filter-label">Projet</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="input-meta"
                >
                  <option value="all">Tous</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="stats-filter-group">
                <label className="stats-filter-label">Plateforme</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="input-meta"
                >
                  <option value="all">Toutes</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="x">X (Twitter)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="threads">Threads</option>
                </select>
              </div>
              <div className="stats-filter-group">
                <label className="stats-filter-label">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input-meta"
                >
                  <option value="all">Tous</option>
                  <option value="post">Post</option>
                  <option value="story">Story</option>
                  <option value="reel">Reel</option>
                  <option value="carousel">Carousel</option>
                </select>
              </div>
              <div className="stats-filter-group">
                <label className="stats-filter-label">Date début</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="stats-filter-input"
                />
              </div>
              <div className="stats-filter-group">
                <label className="stats-filter-label">Date fin</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="stats-filter-input"
                />
              </div>
            </div>
          </div>

            {/* KPI globaux */}
            <div className="stats-kpi-grid stats-overview-kpis">
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <Eye size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{formatNumber(totalViews)}</div>
                <div className="stats-kpi-label">Vues</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <Bookmark size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{formatNumber(totalSaves)}</div>
                <div className="stats-kpi-label">Enregistrements</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <Heart size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{formatNumber(totalLikes)}</div>
                <div className="stats-kpi-label">Likes</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <MessageCircle size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{formatNumber(totalComments)}</div>
                <div className="stats-kpi-label">Commentaires</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <Share2 size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{formatNumber(totalShares)}</div>
                <div className="stats-kpi-label">Partages</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <BarChart3 size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{averageEngagementRate}%</div>
                <div className="stats-kpi-label">Engagement</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">{totalContents}</div>
                <div className="stats-kpi-label">Contenus</div>
              </div>
              {canSeeBudgetAndTarifs() && (
              <div className="stats-kpi-card">
                <div className="stats-kpi-icon">
                  <DollarSign size={24} strokeWidth={2.5} />
                </div>
                <div className="stats-kpi-value">
                  {totalBudget.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                </div>
                <div className="stats-kpi-label">Budget</div>
              </div>
              )}
            </div>

            {/* Blocs: Meilleur contenu, Heures, Sentiment, Projets */}
            <div className="stats-blocks-grid">
              <div className="stats-block-card">
                <h3 className="stats-section-title">
                  <Award size={22} color="#f59e0b" /> Meilleur contenu
                </h3>
                {bestContent && bestContent.insights ? (
                  <>
                    <div className="stats-best-content-platform">
                      {bestContent.platform.charAt(0).toUpperCase() + bestContent.platform.slice(1)}
                      {bestContent.publishedAt && ` · ${new Date(bestContent.publishedAt).toLocaleDateString('fr-FR')}`}
                    </div>
                    <div className="stats-best-content-metrics">
                      <div className="stats-best-metric">
                        <div className="stats-best-metric-value">{formatNumber(bestContent.insights.views || 0)}</div>
                        <div className="stats-best-metric-label">Vues</div>
                      </div>
                      <div className="stats-best-metric">
                        <div className="stats-best-metric-value">{formatNumber(bestContent.insights.likes || 0)}</div>
                        <div className="stats-best-metric-label">Likes</div>
                      </div>
                      <div className="stats-best-metric">
                        <div className="stats-best-metric-value">{Number(bestContent.insights.engagement_rate || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%</div>
                        <div className="stats-best-metric-label">Engagement</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="stats-empty">
                    <Award size={48} strokeWidth={1} />
                    <p>Aucun contenu à afficher</p>
                  </div>
                )}
              </div>

              <div className="stats-block-card">
                <h3 className="stats-section-title">
                  <Clock size={22} color="#3b82f6" /> Meilleures heures
                </h3>
                {bestHours.length > 0 ? (
                  bestHours.map((hour, idx) => {
                    const maxEngagement = bestHours[0].engagement;
                    const pct = maxEngagement > 0 ? (hour.engagement / maxEngagement) * 100 : 0;
                    return (
                      <div key={idx} className="stats-bar-row">
                        <span className="stats-bar-label">{hour.hour}</span>
                        <div className="stats-bar-track" style={{ position: "relative" }}>
                          <div className="stats-bar-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
                          <span className="stats-bar-value">{formatNumber(hour.engagement)}</span>
                        </div>
                        <span className="stats-bar-meta">{hour.posts} contenu(s)</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="stats-empty">
                    <Clock size={48} strokeWidth={1} />
                    <p>Aucune donnée</p>
                  </div>
                )}
              </div>

              <div className="stats-block-card">
                <h3 className="stats-section-title">
                  <ThumbsUp size={22} color="#10b981" /> Sentiment
                </h3>
                <div className="stats-sentiment-row">
                  <div className="stats-sentiment-header">
                    <span className="stats-sentiment-label"><ThumbsUp size={14} color="#10b981" /> Positif</span>
                    <span className="stats-sentiment-pct" style={{ color: "#10b981" }}>{sentiment.positive}%</span>
                  </div>
                  <div className="stats-sentiment-track">
                    <div className="stats-sentiment-fill" style={{ width: `${sentiment.positive}%`, background: "linear-gradient(90deg, #10b981, #059669)" }} />
                  </div>
                </div>
                <div className="stats-sentiment-row">
                  <div className="stats-sentiment-header">
                    <span className="stats-sentiment-label"><Meh size={14} color="#6366f1" /> Neutre</span>
                    <span className="stats-sentiment-pct" style={{ color: "#6366f1" }}>{sentiment.neutral}%</span>
                  </div>
                  <div className="stats-sentiment-track">
                    <div className="stats-sentiment-fill" style={{ width: `${sentiment.neutral}%`, background: "linear-gradient(90deg, #6366f1, #4f46e5)" }} />
                  </div>
                </div>
                <div className="stats-sentiment-row">
                  <div className="stats-sentiment-header">
                    <span className="stats-sentiment-label"><ThumbsDown size={14} color="#ef4444" /> Négatif</span>
                    <span className="stats-sentiment-pct" style={{ color: "#ef4444" }}>{sentiment.negative}%</span>
                  </div>
                  <div className="stats-sentiment-track">
                    <div className="stats-sentiment-fill" style={{ width: `${sentiment.negative}%`, background: "linear-gradient(90deg, #ef4444, #dc2626)" }} />
                  </div>
                </div>
                <div className="stats-sentiment-summary" style={{
                  background: sentiment.positive > 50 ? "linear-gradient(135deg, #d1fae5, #a7f3d0)" : sentiment.negative > 30 ? "linear-gradient(135deg, #fee2e2, #fecaca)" : "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                  color: sentiment.positive > 50 ? "#065f46" : sentiment.negative > 30 ? "#991b1b" : "#3730a3"
                }}>
                  <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--letter-spacing-wide)", marginBottom: 4 }}>
                    Sentiment global
                  </div>
                  <div style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
                    {sentiment.positive > 50 ? "Très positif" : sentiment.negative > 30 ? "Négatif" : "Neutre"}
                  </div>
                </div>
              </div>

              <div className="stats-block-card">
                <h3 className="stats-section-title">
                  <BarChart3 size={22} color="#8b5cf6" /> Top projets
                </h3>
                {projectStatsArray.length > 0 ? (
                  projectStatsArray.slice(0, 5).map((project) => {
                    const maxViews = projectStatsArray[0]?.views || 1;
                    const pct = (project.views / maxViews) * 100;
                    return (
                      <div key={project.projectId} style={{ marginBottom: "var(--spacing-3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>{project.projectName}</span>
                          <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>{formatNumber(project.views)} vues</span>
                        </div>
                        <div className="stats-sentiment-track">
                          <div className="stats-sentiment-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #8b5cf6, #7c3aed)" }} />
                        </div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: 4 }}>
                          {project.contents} contenu(s) · {project.engagementRate.toFixed(2)}% engagement
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="stats-empty">
                    <BarChart3 size={48} strokeWidth={1} />
                    <p>Aucune donnée</p>
                  </div>
                )}
              </div>
            </div>
        </section>

        {/* Par plateforme + analyse de sentiment */}
        <section className="stats-section" aria-label="Par plateforme">
          <h2 className="stats-section-title">
            <Smartphone size={22} /> Par plateforme
          </h2>
            <div className="stats-cards-grid">
              {platformStatsArray.length === 0 ? (
                <div className="stats-empty" style={{ gridColumn: "1 / -1" }}>Aucune donnée plateforme</div>
              ) : (
                platformStatsArray.map((item) => {
                  const Icon = networkIcons[item.platform] || Users;
                  const color = networkColors[item.platform] || "#64748b";
                  const sent = item.sentiment ?? { positive: 0, neutral: 0, negative: 0 };
                  return (
                    <div key={item.platform} className="stats-entity-card">
                      <div className="stats-entity-header">
                        <div className="stats-entity-icon" style={{ background: `${color}1A` }}>
                          <Icon size={24} style={{ color }} />
                        </div>
                        <div>
                          <h4 className="stats-entity-name">{item.platform}</h4>
                          <div className="stats-entity-meta">{item.contents} contenu(s)</div>
                        </div>
                      </div>
                      <div className="stats-entity-metrics">
                        <div className="stats-metric-box">
                          <div className="stats-metric-label">Vues</div>
                          <div className="stats-metric-value">{formatNumber(item.views)}</div>
                        </div>
                        <div className="stats-metric-box">
                          <div className="stats-metric-label">Likes</div>
                          <div className="stats-metric-value">{formatNumber(item.likes)}</div>
                        </div>
                        <div className="stats-metric-box">
                          <div className="stats-metric-label">Commentaires</div>
                          <div className="stats-metric-value">{formatNumber(item.comments)}</div>
                        </div>
                        <div className="stats-metric-box">
                          <div className="stats-metric-label">Engagement</div>
                          <div className="stats-metric-value">{item.engagementRate.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div className="stats-entity-sentiment">
                        <div className="stats-sentiment-header">
                          <span className="stats-sentiment-label"><ThumbsUp size={12} color="#10b981" /> Positif</span>
                          <span className="stats-sentiment-pct" style={{ color: "#10b981", fontSize: "0.75rem" }}>{sent.positive}%</span>
                        </div>
                        <div className="stats-sentiment-track">
                          <div className="stats-sentiment-fill" style={{ width: `${sent.positive}%`, background: "#10b981" }} />
                        </div>
                        <div className="stats-sentiment-header">
                          <span className="stats-sentiment-label"><Meh size={12} color="#6366f1" /> Neutre</span>
                          <span className="stats-sentiment-pct" style={{ color: "#6366f1", fontSize: "0.75rem" }}>{sent.neutral}%</span>
                        </div>
                        <div className="stats-sentiment-track">
                          <div className="stats-sentiment-fill" style={{ width: `${sent.neutral}%`, background: "#6366f1" }} />
                        </div>
                        <div className="stats-sentiment-header">
                          <span className="stats-sentiment-label"><ThumbsDown size={12} color="#ef4444" /> Négatif</span>
                          <span className="stats-sentiment-pct" style={{ color: "#ef4444", fontSize: "0.75rem" }}>{sent.negative}%</span>
                        </div>
                        <div className="stats-sentiment-track">
                          <div className="stats-sentiment-fill" style={{ width: `${sent.negative}%`, background: "#ef4444" }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </section>

        {/* Par projet + analyse de sentiment */}
        <section className="stats-section" aria-label="Par projet">
          <h2 className="stats-section-title">
            <BarChart3 size={22} /> Par projet
          </h2>
            <div className="stats-cards-grid">
              {projectStatsArray.length === 0 ? (
                <div className="stats-empty" style={{ gridColumn: "1 / -1" }}>Aucune donnée</div>
              ) : (
                projectStatsArray.map((project) => {
                  const sent = project.sentiment ?? { positive: 0, neutral: 0, negative: 0 };
                  return (
                  <div key={project.projectId} className="stats-entity-card">
                    <div className="stats-entity-header">
                      <div className="stats-entity-icon" style={{ background: "var(--color-primary-50)" }}>
                        <BarChart3 size={24} style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div>
                        <h4 className="stats-entity-name">{project.projectName}</h4>
                        <div className="stats-entity-meta">{project.contents} contenu(s)</div>
                      </div>
                    </div>
                    <div className="stats-entity-metrics">
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Vues</div>
                        <div className="stats-metric-value">{formatNumber(project.views)}</div>
                      </div>
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Likes</div>
                        <div className="stats-metric-value">{formatNumber(project.likes)}</div>
                      </div>
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Engagement</div>
                        <div className="stats-metric-value">{project.engagementRate.toFixed(2)}%</div>
                      </div>
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Partages</div>
                        <div className="stats-metric-value">{formatNumber(project.shares)}</div>
                      </div>
                    </div>
                    <div className="stats-entity-sentiment">
                      <div className="stats-sentiment-header">
                        <span className="stats-sentiment-label"><ThumbsUp size={12} color="#10b981" /> Positif</span>
                        <span className="stats-sentiment-pct" style={{ color: "#10b981", fontSize: "0.75rem" }}>{sent.positive}%</span>
                      </div>
                      <div className="stats-sentiment-track">
                        <div className="stats-sentiment-fill" style={{ width: `${sent.positive}%`, background: "#10b981" }} />
                      </div>
                      <div className="stats-sentiment-header">
                        <span className="stats-sentiment-label"><Meh size={12} color="#6366f1" /> Neutre</span>
                        <span className="stats-sentiment-pct" style={{ color: "#6366f1", fontSize: "0.75rem" }}>{sent.neutral}%</span>
                      </div>
                      <div className="stats-sentiment-track">
                        <div className="stats-sentiment-fill" style={{ width: `${sent.neutral}%`, background: "#6366f1" }} />
                      </div>
                      <div className="stats-sentiment-header">
                        <span className="stats-sentiment-label"><ThumbsDown size={12} color="#ef4444" /> Négatif</span>
                        <span className="stats-sentiment-pct" style={{ color: "#ef4444", fontSize: "0.75rem" }}>{sent.negative}%</span>
                      </div>
                      <div className="stats-sentiment-track">
                        <div className="stats-sentiment-fill" style={{ width: `${sent.negative}%`, background: "#ef4444" }} />
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
        </section>

        {socialAccountStatsArray.length > 0 && (
          <section className="stats-section" aria-label="Par compte">
            <h2 className="stats-section-title">
              <Users size={22} /> Par compte
            </h2>
            <div className="stats-cards-grid">
              {socialAccountStatsArray.map((account) => {
                const Icon = networkIcons[account.network] || Users;
                const color = networkColors[account.network] || "#64748b";
                const name = account.pageName || account.accountName || account.pageId || account.accountId || "Compte";
                return (
                  <div key={`${account.network}-${account.pageId || account.accountId || "default"}`} className="stats-entity-card">
                    <div className="stats-entity-header">
                      <div className="stats-entity-icon" style={{ background: `${color}1A` }}>
                        <Icon size={24} style={{ color }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 className="stats-entity-name">{name}</h4>
                        <div className="stats-entity-meta">{account.network} · {account.projectName}</div>
                      </div>
                    </div>
                    <div className="stats-entity-metrics">
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Contenus</div>
                        <div className="stats-metric-value">{account.contents}</div>
                      </div>
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Engagement</div>
                        <div className="stats-metric-value">{account.engagementRate.toFixed(2)}%</div>
                      </div>
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Vues</div>
                        <div className="stats-metric-value">{formatNumber(account.views)}</div>
                      </div>
                      <div className="stats-metric-box">
                        <div className="stats-metric-label">Likes</div>
                        <div className="stats-metric-value">{formatNumber(account.likes)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Par influenceur + analyse de sentiment */}
        {influencerStatsArray.length > 0 && (
          <section className="stats-section" aria-label="Par influenceur">
            <h2 className="stats-section-title">
              <UserCircle size={22} /> Par influenceur
            </h2>
            <div className="stats-cards-grid">
              {influencerStatsArray.map((inf) => {
                const sent = inf.sentiment ?? { positive: 0, neutral: 0, negative: 0 };
                return (
                <div key={inf.influencerId} className="stats-entity-card">
                  <div className="stats-entity-header">
                    <div className="stats-entity-icon" style={{ background: "var(--color-primary-50)" }}>
                      <UserCircle size={24} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div>
                      <h4 className="stats-entity-name">{(inf.name || "").toUpperCase()}</h4>
                      <div className="stats-entity-meta">{inf.contents} contenu(s)</div>
                      {inf.platforms.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                          {inf.platforms.map((p) => (
                            <span key={p} style={{ padding: "2px 8px", borderRadius: 999, background: "var(--color-gray-100)", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="stats-entity-metrics">
                    <div className="stats-metric-box">
                      <div className="stats-metric-label">Vues</div>
                      <div className="stats-metric-value">{formatNumber(inf.views)}</div>
                    </div>
                    <div className="stats-metric-box">
                      <div className="stats-metric-label">Engagement</div>
                      <div className="stats-metric-value">{inf.engagementRate.toFixed(2)}%</div>
                    </div>
                    <div className="stats-metric-box">
                      <div className="stats-metric-label">Likes</div>
                      <div className="stats-metric-value">{formatNumber(inf.likes)}</div>
                    </div>
                    <div className="stats-metric-box">
                      <div className="stats-metric-label">Commentaires</div>
                      <div className="stats-metric-value">{formatNumber(inf.comments)}</div>
                    </div>
                  </div>
                  <div className="stats-entity-sentiment">
                    <div className="stats-sentiment-header">
                      <span className="stats-sentiment-label"><ThumbsUp size={12} color="#10b981" /> Positif</span>
                      <span className="stats-sentiment-pct" style={{ color: "#10b981", fontSize: "0.75rem" }}>{sent.positive}%</span>
                    </div>
                    <div className="stats-sentiment-track">
                      <div className="stats-sentiment-fill" style={{ width: `${sent.positive}%`, background: "#10b981" }} />
                    </div>
                    <div className="stats-sentiment-header">
                      <span className="stats-sentiment-label"><Meh size={12} color="#6366f1" /> Neutre</span>
                      <span className="stats-sentiment-pct" style={{ color: "#6366f1", fontSize: "0.75rem" }}>{sent.neutral}%</span>
                    </div>
                    <div className="stats-sentiment-track">
                      <div className="stats-sentiment-fill" style={{ width: `${sent.neutral}%`, background: "#6366f1" }} />
                    </div>
                    <div className="stats-sentiment-header">
                      <span className="stats-sentiment-label"><ThumbsDown size={12} color="#ef4444" /> Négatif</span>
                      <span className="stats-sentiment-pct" style={{ color: "#ef4444", fontSize: "0.75rem" }}>{sent.negative}%</span>
                    </div>
                    <div className="stats-sentiment-track">
                      <div className="stats-sentiment-fill" style={{ width: `${sent.negative}%`, background: "#ef4444" }} />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}
        {Object.keys(typeStats).length > 0 && (
          <section className="stats-section" aria-label="Par type">
            <h2 className="stats-section-title">
              <FileBarChart size={22} /> Par type de contenu
            </h2>
            <div className="stats-type-grid">
              {Object.entries(typeStats).map(([type, stats]) => (
                <div key={type} className="stats-type-card">
                  <div className="stats-type-name">{type}</div>
                  <div className="stats-type-value">{stats.contents}</div>
                  <div className="stats-type-label">Contenus</div>
                  <div className="stats-type-value" style={{ fontSize: "var(--font-size-lg)", marginTop: "var(--spacing-3)" }}>{formatNumber(stats.views)}</div>
                  <div className="stats-type-label">Vues</div>
                  <div className="stats-type-value" style={{ fontSize: "var(--font-size-lg)", marginTop: "var(--spacing-3)" }}>
                    {stats.engagementRateCount > 0 ? (stats.engagementRateSum / stats.engagementRateCount).toFixed(2) + "%" : "0%"}
                  </div>
                  <div className="stats-type-label">Engagement</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
