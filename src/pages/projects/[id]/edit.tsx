import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function EditProject() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    color: '#667eea',
    status: 'active'
  });

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProject(data.project);
        setFormData({
          name: data.project.name || '',
          description: data.project.description || '',
          client: data.project.client || '',
          color: data.project.color || '#667eea',
          status: data.project.status || 'active'
        });
      } else {
        alert('Erreur lors du chargement du projet');
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'admin') {
      alert('Accès refusé. Seuls les administrateurs peuvent modifier les projets.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Projet modifié avec succès');
        router.push('/projects');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible de modifier le projet'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Erreur lors de la modification du projet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.role !== 'admin') {
      alert('Accès refusé. Seuls les administrateurs peuvent supprimer les projets.');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project?.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Projet supprimé avec succès');
        router.push('/projects');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible de supprimer le projet'}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Erreur lors de la suppression du projet');
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
          <p>Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h2>Projet non trouvé</h2>
          <Link href="/projects">
            <button className="btn-primary">Retour aux projets</button>
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
            <Link href="/projects">
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
                Retour
              </button>
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h1 className="page-title">Modifier le Projet</h1>
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
              <p className="page-subtitle">Modifiez les informations du projet</p>
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
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "600",
              color: "#111"
            }}>
              Nom du projet *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "1rem"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "600",
              color: "#111"
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "1rem",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "600",
              color: "#111"
            }}>
              Client
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "1rem"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "600",
              color: "#111"
            }}>
              Couleur
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  width: "60px",
                  height: "40px",
                  border: "2px solid #e5e5e5",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: "2px solid #e5e5e5",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "600",
              color: "#111"
            }}>
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "1rem"
              }}
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <Link href="/projects">
              <button 
                type="button"
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                Annuler
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                background: saving ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Save size={16} />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
