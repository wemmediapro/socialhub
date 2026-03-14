import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { normalizeMediaUrl } from "@/lib/utils";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Shield, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Hash, 
  Upload,
  X,
  Facebook,
  Instagram,
  Music,
  FileText,
  Film,
  Layers,
  AlignLeft,
  Palette,
  Monitor,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import EmojiPicker from "@/components/EmojiPicker";

export default function EditPost() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { id } = router.query;
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    projectId: '',
    projectIds: [] as string[],
    caption: '',
    description: '',
    captionIt: '',
    descriptionIt: '',
    hashtags: '',
    type: 'post' as 'post' | 'story' | 'reel' | 'carousel',
    networks: ['instagram'] as string[],
    scheduledAt: '',
    mediaUrls: [] as string[],
    assignedTo: 'infographiste' as 'infographiste' | 'video_motion'
  });

  const descriptionRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const hashtagsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Charger les projets
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        setProjects(data.projects || []);
      })
      .catch(console.error);

    if (id) {
      fetchPost();
    }
  }, [id]);

  const uploadToLocal = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/upload/local", {
      method: "POST",
      body: formData
    });
    
    const result = await response.json();
    if (!result.success) throw new Error("Upload failed");
    
    // Retourner l'URL via l'API route (fonctionne en production)
    return `${window.location.origin}${result.url}`;
  };

  const onFile = async (e: any) => {
    const files: FileList = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (let i=0; i<files.length; i++) {
      try {
        const u = await uploadToLocal(files[i]);
        urls.push(u);
      } catch (error) {
        console.error("Upload error:", error);
        alert(`${t('workflow.uploadError')}: ${files[i].name}`);
      }
    }
    setFormData({ ...formData, mediaUrls: [...formData.mediaUrls, ...urls] });
    setUploading(false);
  };

  const removeMedia = (index: number) => {
    const updated = formData.mediaUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, mediaUrls: updated });
  };

  const insertEmoji = (field: "description" | "caption" | "hashtags", emoji: string) => {
    const ref = field === "description" ? descriptionRef : field === "caption" ? captionRef : hashtagsRef;
    const input = ref.current;
    
    if (!input) {
      setFormData({ ...formData, [field]: (formData[field] || "") + emoji });
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = formData[field] || "";
    const newText = text.substring(0, start) + emoji + text.substring(end);
    
    setFormData({ ...formData, [field]: newText });
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const toggleNetwork = (network: string) => {
    const networks = formData.networks.includes(network)
      ? formData.networks.filter(n => n !== network)
      : [...formData.networks, network];
    setFormData({ ...formData, networks });
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setPost(data.post);
        const scheduledDate = data.post.scheduledAt 
          ? new Date(data.post.scheduledAt).toISOString().slice(0, 16)
          : new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16);
        
        setFormData({
          projectId: data.post.projectId || data.post.projectIds?.[0] || '',
          projectIds: data.post.projectIds || (data.post.projectId ? [data.post.projectId] : []),
          caption: data.post.caption || '',
          description: data.post.description || '',
          captionIt: data.post.captionIt || '',
          descriptionIt: data.post.descriptionIt || '',
          hashtags: data.post.hashtags || '',
          type: data.post.type || 'post',
          networks: data.post.networks || (data.post.network ? [data.post.network] : ['instagram']),
          scheduledAt: scheduledDate,
          mediaUrls: data.post.mediaUrls || [],
          assignedTo: data.post.assignedTo || 'infographiste'
        });
      } else {
        alert('Erreur lors du chargement du post');
        router.push('/workflow');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Erreur lors du chargement du post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'admin') {
      alert(t('common.error') + ': ' + t('posts.accessDenied'));
      return;
    }

    setSaving(true);
    try {
      const body = { 
        ...formData, 
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        projectId: formData.projectIds[0] || formData.projectId,
        projectIds: formData.projectIds
      };
      
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        alert(t('posts.editSuccess'));
        router.push('/workflow');
      } else {
        const error = await response.json();
        alert(`${t('common.error')}: ${error.error || t('posts.editError')}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert(t('posts.editError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.role !== 'admin') {
      alert(t('common.error') + ': ' + t('posts.accessDenied'));
      return;
    }

    if (!confirm(t('posts.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert(t('posts.deleteSuccess'));
        router.push('/workflow');
      } else {
        const error = await response.json();
        alert(`${t('common.error')}: ${error.error || t('posts.deleteError')}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(t('posts.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem"
          }}></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-container">
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h2>{t('posts.notFound')}</h2>
          <Link href="/workflow">
            <button className="btn-primary">{t('common.back')} {t('common.posts')}</button>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/workflow">
              <button 
                style={{
                  padding: "0.5rem",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <ArrowLeft size={16} />
                {t('common.back')}
              </button>
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h1 className="page-title">{t('posts.edit')}</h1>
                {isAdmin && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.25rem 0.75rem",
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    <Shield size={12} />
                    Admin
                  </div>
                )}
              </div>
              <p className="page-subtitle">{t('posts.editSubtitle')}</p>
            </div>
          </div>
          
          {isAdmin && (
            <button
              onClick={handleDelete}
              style={{
                padding: "0.5rem 1rem",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600"
              }}
            >
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
        <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "350px 1fr", gap: "1.5rem" }}>
          
          {/* Left Sidebar - Configuration */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Project Selection - Multiple */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700", 
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999"
            }}>
                {t('common.projects')} ({formData.projectIds.length} {formData.projectIds.length > 1 ? t('posts.selected') : t('posts.selected')})
              </h3>
              
              {projects.length === 0 ? (
                <div style={{ 
                  padding: "1rem", 
                  background: "#f9fafb", 
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "0.875rem"
                }}>
                  {t('posts.noProjectsAvailable')}
                </div>
              ) : (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "0.5rem",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {projects.map(project => {
                    const isSelected = formData.projectIds.includes(project._id);
                    return (
                      <div
                        key={project._id}
                        onClick={() => {
                          const newProjectIds = isSelected
                            ? formData.projectIds.filter(id => id !== project._id)
                            : [...formData.projectIds, project._id];
                          setFormData({
                            ...formData,
                            projectIds: newProjectIds,
                            projectId: newProjectIds[0] || project._id
                          });
                        }}
              style={{
                padding: "0.75rem",
                          background: isSelected ? "#667eea10" : "#f9fafb",
                          border: `2px solid ${isSelected ? "#667eea" : "#e5e5e5"}`,
                borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: `2px solid ${isSelected ? "#667eea" : "#d1d5db"}`,
                          background: isSelected ? "#667eea" : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {isSelected && (
                            <div style={{
                              width: "10px",
                              height: "6px",
                              borderLeft: "2px solid white",
                              borderBottom: "2px solid white",
                              transform: "rotate(-45deg) translateY(-1px)"
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: "0.875rem", 
                            fontWeight: "600", 
                            color: isSelected ? "#667eea" : "#111"
                          }}>
                            {project.name}
                          </div>
                          {project.client && (
                            <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.125rem" }}>
                              {project.client}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigned To */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700", 
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999"
              }}>
                {t('posts.createdBy')}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div
                  onClick={() => setFormData({ ...formData, assignedTo: "infographiste" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "1rem",
                    border: `2px solid ${formData.assignedTo === "infographiste" ? "#ec4899" : "#e5e5e5"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: formData.assignedTo === "infographiste" ? "#ec489908" : "white"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    background: formData.assignedTo === "infographiste" ? "linear-gradient(135deg, #ec4899, #db2777)" : "#f8f9fa",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Palette 
                      size={20} 
                      strokeWidth={2} 
                      style={{ color: formData.assignedTo === "infographiste" ? "white" : "#999" }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "0.9375rem", 
                      fontWeight: formData.assignedTo === "infographiste" ? "700" : "600",
                      color: formData.assignedTo === "infographiste" ? "#ec4899" : "#111"
                    }}>
                      {t('posts.infographiste')}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "#999" }}>
                      {t('posts.infographisteDesc')}
                    </div>
                  </div>
                  {formData.assignedTo === "infographiste" && (
                    <div style={{
                      width: "20px",
                      height: "20px",
                      background: "#ec4899",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setFormData({ ...formData, assignedTo: "video_motion" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "1rem",
                    border: `2px solid ${formData.assignedTo === "video_motion" ? "#8b5cf6" : "#e5e5e5"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: formData.assignedTo === "video_motion" ? "#8b5cf608" : "white"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    background: formData.assignedTo === "video_motion" ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "#f8f9fa",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Monitor 
                      size={20} 
                      strokeWidth={2} 
                      style={{ color: formData.assignedTo === "video_motion" ? "white" : "#999" }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "0.9375rem", 
                      fontWeight: formData.assignedTo === "video_motion" ? "700" : "600",
                      color: formData.assignedTo === "video_motion" ? "#8b5cf6" : "#111"
                    }}>
                      {t('posts.videoMotion')}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "#999" }}>
                      {t('posts.videoMotionDesc')}
                    </div>
                  </div>
                  {formData.assignedTo === "video_motion" && (
                    <div style={{
                      width: "20px",
                      height: "20px",
                      background: "#8b5cf6",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700", 
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999"
              }}>
                {t('posts.socialNetworks')}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { value: "instagram", label: "Instagram", icon: Instagram, color: "#e4405f" },
                  { value: "facebook", label: "Facebook", icon: Facebook, color: "#1877f2" },
                  { value: "tiktok", label: "TikTok", icon: Music, color: "#000000" },
                  { value: "threads", label: "Threads", icon: MessageCircle, color: "#101010" },
                ].map((network) => {
                  const Icon = network.icon;
                  const isSelected = formData.networks.includes(network.value);
                  return (
                    <div
                      key={network.value}
                      onClick={() => toggleNetwork(network.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.875rem 1rem",
                        border: `2px solid ${isSelected ? network.color : "#e5e5e5"}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: isSelected ? `${network.color}08` : "white"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Icon 
                          size={18} 
                          strokeWidth={2} 
                          style={{ color: isSelected ? network.color : "#999" }} 
                        />
                        <span style={{ 
                          fontSize: "0.875rem", 
                          fontWeight: isSelected ? "600" : "500",
                          color: isSelected ? network.color : "#666"
                        }}>
                          {network.label}
                        </span>
                      </div>
                      {isSelected && (
                        <div style={{
                          width: "18px",
                          height: "18px",
                          background: network.color,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>

            {/* Post Type */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700", 
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999"
            }}>
                {t('posts.contentType')}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {[
                  { value: "post", label: "Post", icon: FileText },
                  { value: "story", label: "Story", icon: Film },
                  { value: "reel", label: "Reel", icon: Video },
                  { value: "carousel", label: "Carousel", icon: Layers },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.value;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      style={{
                        padding: "1rem 0.75rem",
                        border: `2px solid ${isSelected ? "#6366f1" : "#e5e5e5"}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: isSelected ? "#6366f108" : "white",
                        textAlign: "center"
                      }}
                    >
                      <Icon 
                        size={20} 
                        strokeWidth={2} 
              style={{
                          margin: "0 auto 0.5rem",
                          color: isSelected ? "#6366f1" : "#999"
                        }} 
                      />
                      <div style={{ 
                        fontSize: "0.75rem", 
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? "#6366f1" : "#666"
                      }}>
                        {type.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700", 
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999"
              }}>
                {t('posts.scheduledAt')}
              </h3>
              <input 
                type="datetime-local" 
                value={formData.scheduledAt} 
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                style={{ width: "100%", fontSize: "0.875rem", padding: "0.75rem" }}
              />
            </div>
          </div>

          {/* Right Main Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Description */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999"
            }}>
                  <AlignLeft size={14} />
                  {t('posts.internalDescription')}
            </label>
                <EmojiPicker onSelect={(emoji) => insertEmoji("description", emoji)} />
              </div>
            <input
                ref={descriptionRef}
              type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('posts.internalDescriptionPlaceholder')}
              style={{
                width: "100%",
                  fontSize: "0.9375rem",
                  padding: "0.875rem",
                  fontWeight: "500"
              }}
            />
          </div>

            {/* Description (italien) */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <label style={{ 
                display: "block",
                fontSize: "0.75rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999",
                marginBottom: "0.75rem"
              }}>
                {t('posts.descriptionIt')}
              </label>
              <input
                type="text"
                value={formData.descriptionIt}
                onChange={(e) => setFormData({ ...formData, descriptionIt: e.target.value })}
                placeholder={t('posts.descriptionItPlaceholder')}
                style={{
                  width: "100%",
                  fontSize: "0.9375rem",
                  padding: "0.875rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Caption */}
            <div className="card" style={{ padding: "1.5rem", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#999"
            }}>
                    <FileText size={14} />
                    {t('common.caption')}
            </label>
                  <EmojiPicker onSelect={(emoji) => insertEmoji("caption", emoji)} />
                </div>
                <span style={{ 
                  fontSize: "0.6875rem", 
                  color: "#999", 
                  fontWeight: "600"
                }}>
                  {formData.caption?.length || 0} / 2200
                </span>
              </div>
              <textarea
                ref={captionRef}
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder={t('posts.captionPlaceholder')}
                rows={8}
                required
              style={{
                width: "100%",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  padding: "1rem",
                  resize: "vertical"
                }}
              />
          </div>

            {/* Caption (italien) */}
            <div className="card" style={{ padding: "1.5rem", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999"
                }}>
                  <FileText size={14} />
                  {t('posts.captionIt')}
                </label>
                <span style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "600" }}>
                  {formData.captionIt?.length || 0} / 2200
                </span>
              </div>
              <textarea
                value={formData.captionIt}
                onChange={(e) => setFormData({ ...formData, captionIt: e.target.value })}
                placeholder={t('posts.captionItPlaceholder')}
                rows={6}
                style={{
                  width: "100%",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  padding: "1rem",
                  resize: "vertical"
                }}
              />
          </div>

            {/* Hashtags */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#999"
                }}>
                  <Hash size={14} />
                  {t('common.hashtags')}
                </label>
                <EmojiPicker onSelect={(emoji) => insertEmoji("hashtags", emoji)} />
              </div>
              <input
                ref={hashtagsRef}
                type="text"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder={t('posts.hashtagsPlaceholder')}
                style={{ 
                  width: "100%", 
                  fontSize: "0.9375rem",
                  padding: "0.875rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Media Upload */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                fontWeight: "700", 
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#999"
              }}>
                Media ({formData.mediaUrls.length})
              </h3>

              <label style={{
                display: "block",
                padding: "2rem",
                border: "2px dashed #e5e5e5",
                borderRadius: "12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03))",
                marginBottom: formData.mediaUrls.length > 0 ? "1.5rem" : "0"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e5e5";
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03))";
              }}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={onFile}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
                {uploading ? (
                  <>
                    <div className="pulse" style={{
                      width: "64px",
                      height: "64px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem"
                    }}>
                      <Upload size={32} color="white" strokeWidth={2} />
          </div>
                    <p style={{ fontSize: "1rem", fontWeight: "600", color: "#667eea" }}>
                      {t('workflow.uploading')}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={40} strokeWidth={1.5} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
                    <p style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.375rem" }}>
                      {t('posts.uploadMedia')}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "#999" }}>
                      PNG, JPG, MP4 • Max 100MB
                    </p>
                  </>
                )}
              </label>

              {/* Media Grid */}
              {formData.mediaUrls.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  {formData.mediaUrls.map((url, i) => {
                    const normalizedUrl = normalizeMediaUrl(url);
                    const isVideo = url.match(/\.mp4($|\?)/i);
                    return (
                      <div 
                        key={i} 
                        className="card"
                        style={{ 
                          position: "relative",
                          borderRadius: "12px",
                          overflow: "hidden",
                          padding: 0,
                          aspectRatio: "1",
                          border: "2px solid #e5e5e5"
                        }}
                      >
                        {isVideo ? (
                          <video 
                            src={normalizedUrl} 
                            controls 
                            playsInline
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <img 
                            src={normalizedUrl} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            alt={`Media ${i+1}`}
                          />
                        )}
              <button 
                type="button"
                          onClick={() => removeMedia(i)}
                style={{
                            position: "absolute",
                            top: "0.5rem",
                            right: "0.5rem",
                            width: "28px",
                            height: "28px",
                            background: "rgba(0,0,0,0.7)",
                            backdropFilter: "blur(10px)",
                  border: "none",
                            borderRadius: "50%",
                            color: "white",
                  cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                        
                        <div style={{
                          position: "absolute",
                          bottom: "0.5rem",
                          left: "0.5rem",
                          padding: "0.25rem 0.625rem",
                          background: "rgba(0,0,0,0.7)",
                          backdropFilter: "blur(10px)",
                          borderRadius: "6px",
                          fontSize: "0.6875rem",
                          color: "white",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}>
                          {isVideo ? <Video size={10} /> : <ImageIcon size={10} />}
                          {isVideo ? t('posts.video') : t('posts.image')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link href="/workflow" style={{ flex: 1 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "100%", padding: "0.875rem" }}
                >
                  {t('common.cancel')}
              </button>
            </Link>
            <button
              type="submit"
                disabled={saving || uploading || formData.networks.length === 0}
                className="btn btn-primary"
              style={{
                  opacity: (saving || uploading || formData.networks.length === 0) ? 0.6 : 1,
                  cursor: (saving || uploading || formData.networks.length === 0) ? "not-allowed" : "pointer",
                  padding: "0.875rem 2rem",
                display: "flex",
                alignItems: "center",
                  justifyContent: "center",
                  gap: "0.625rem",
                  fontSize: "0.9375rem",
                  flex: 2
              }}
            >
                {saving ? t('common.saving') : (
                  <>
                    <Save size={16} strokeWidth={2.5} />
                    {t('common.save')}
                  </>
                )}
            </button>
            </div>
          </div>
          </div>
        </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}