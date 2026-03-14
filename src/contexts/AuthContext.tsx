import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { PermissionKey, PagePermissions, PermissionMatrix as PermMatrix } from '@/models/Permission';

type UserRole = 'admin' | 'digital_creative' | 'client' | 'infographiste' | 'video_motion' | 'influencer';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  projectIds: string[];
};

/** Matrice côté client : toujours au format PagePermissions après normalisation API */
type PermissionMatrix = PermMatrix;

const PAGE_TO_KEY: Record<string, PermissionKey> = {
  '/': 'dashboard',
  '/stats': 'stats',
  '/projects': 'projects',
  '/ideas': 'ideas',
  '/workflow': 'workflowPosts',
  '/calendar': 'calendarPosts',
  '/influencers': 'influencers',
  '/collab': 'workflowCollab',
  '/calendar-collab': 'calendarCollab',
  '/library': 'library',
  '/settings': 'settings'
};

function getPagePerms(matrix: PermissionMatrix | null, role: UserRole, pageOrKey: string): PagePermissions | null {
  if (!matrix || !(role in matrix)) return null;
  let key: PermissionKey | undefined = pageOrKey as PermissionKey;
  if (pageOrKey.startsWith('/')) key = PAGE_TO_KEY[pageOrKey];
  if (!key || !(key in matrix[role])) return null;
  const p = matrix[role][key];
  if (typeof p === 'boolean') return { view: p, create: p, update: p, delete: p, workflow: p };
  return p;
}

type AuthContextType = {
  user: User | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasAccess: (page: string) => boolean;
  /** Consulter (voir) la page / la ressource */
  canView: (pageOrKey: string) => boolean;
  /** Ajouter / créer sur la page */
  canCreate: (pageOrKey: string) => boolean;
  /** Modifier sur la page */
  canUpdate: (pageOrKey: string) => boolean;
  /** Supprimer sur la page */
  canDelete: (pageOrKey: string) => boolean;
  /** Actions workflow (valider, rejeter, etc.) sur la page */
  canWorkflow: (pageOrKey: string) => boolean;
  canAccessProject: (projectId: string) => boolean;
  canSeeBudgetAndTarifs: () => boolean;
  /** True si l'utilisateur peut voir les coordonnées (email, téléphone) des influenceurs dans l'overlay */
  canSeeInfluencerContact: () => boolean;
  /** Recharge les permissions depuis l'API (après modification par l'admin) */
  refreshPermissions: () => Promise<void>;
  /** Matrice des permissions (pour édition dans Paramètres) */
  permissionMatrix: PermissionMatrix | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissionMatrix(data.matrix || null);
      }
    } catch (e) {
      console.error('Failed to fetch permissions:', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    } else {
      setPermissionMatrix(null);
    }
  }, [user, fetchPermissions]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Don't allow demo user or users without proper structure
        if (parsedUser && parsedUser.id && parsedUser.id !== 'DEMO_USER' && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Clear invalid demo session
          console.log('Clearing invalid demo session');
          localStorage.removeItem('currentUser');
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
        // Clear invalid session
        localStorage.removeItem('currentUser');
      }
    }
    // No auto-login demo user - require authentication
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      console.log('Login response:', { status: response.status, data });
      
      if (response.ok && data.user && data.success) {
        console.log('Login successful, setting user:', data.user);
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        return data.user;
      } else {
        console.log('Login failed:', data);
        throw new Error(data.error || 'Identifiants incorrects');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setPermissionMatrix(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  };

  const hasAccess = (page: string): boolean => {
    if (!user) return false;
    const perms = getPagePerms(permissionMatrix, user.role, page);
    if (perms) return perms.view;
    // Fallback : logique par défaut
    const role = user.role;
    if (page === '/settings') return role === 'admin';
    if (role === 'admin') return true;
    if (role === 'digital_creative' || role === 'client') return !['/settings'].includes(page);
    if (role === 'infographiste' || role === 'video_motion') {
      return ['/', '/stats', '/projects', '/ideas', '/workflow', '/calendar', '/library'].includes(page);
    }
    if (role === 'influencer') return ['/collab', '/calendar-collab'].includes(page);
    return false;
  };

  const canView = (pageOrKey: string): boolean => {
    if (!user) return false;
    const perms = getPagePerms(permissionMatrix, user.role, pageOrKey);
    return perms ? perms.view : false;
  };

  const canCreate = (pageOrKey: string): boolean => {
    if (!user) return false;
    const perms = getPagePerms(permissionMatrix, user.role, pageOrKey);
    return perms ? perms.create : false;
  };

  const canUpdate = (pageOrKey: string): boolean => {
    if (!user) return false;
    const perms = getPagePerms(permissionMatrix, user.role, pageOrKey);
    return perms ? perms.update : false;
  };

  const canDelete = (pageOrKey: string): boolean => {
    if (!user) return false;
    const perms = getPagePerms(permissionMatrix, user.role, pageOrKey);
    return perms ? perms.delete : false;
  };

  const canWorkflow = (pageOrKey: string): boolean => {
    if (!user) return false;
    const perms = getPagePerms(permissionMatrix, user.role, pageOrKey);
    return perms ? perms.workflow : false;
  };

  const canSeeBudgetAndTarifs = (): boolean => {
    if (!user) return false;
    if (permissionMatrix && user.role in permissionMatrix) {
      const p = permissionMatrix[user.role].budgetAndTarifs;
      return typeof p === 'boolean' ? p : p.view;
    }
    return user.role === 'admin' || user.role === 'client';
  };

  const canSeeInfluencerContact = (): boolean => {
    if (!user) return false;
    if (permissionMatrix && user.role in permissionMatrix) {
      const rolePerms = permissionMatrix[user.role];
      const p = rolePerms.influencerContact;
      if (typeof p === 'boolean') return p;
      return p.view;
    }
    return user.role === 'admin' || user.role === 'digital_creative' || user.role === 'client';
  };

  const canAccessProject = (projectId: string): boolean => {
    if (!user) return false;
    
    // Admin can access all projects
    if (user.role === 'admin') return true;
    
    // Digital Creative and Client can access assigned projects
    if (user.role === 'digital_creative' || user.role === 'client') {
      return user.projectIds.length === 0 || user.projectIds.includes(projectId);
    }
    
    // Others: check if assigned
    return user.projectIds.includes(projectId);
  };

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, logout, hasAccess, canView, canCreate, canUpdate, canDelete, canWorkflow, canAccessProject, canSeeBudgetAndTarifs, canSeeInfluencerContact, refreshPermissions, permissionMatrix }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // En développement, on veut voir l'erreur pour la débugger
    if (typeof window !== 'undefined') {
      console.error('useAuth must be used within an AuthProvider');
    }
    // Return default values instead of throwing error during SSR
    return {
      user: null,
      isInitialized: false,
      login: async () => {
        console.error('Login function called but AuthProvider context is undefined!');
        throw new Error('AuthProvider not found');
      },
      logout: () => {
        console.error('Logout function called but AuthProvider context is undefined!');
      },
      hasAccess: () => false,
      canView: () => false,
      canCreate: () => false,
      canUpdate: () => false,
      canDelete: () => false,
      canWorkflow: () => false,
      canAccessProject: () => false,
      canSeeBudgetAndTarifs: () => false,
      canSeeInfluencerContact: () => false,
      refreshPermissions: async () => {},
      permissionMatrix: null
    };
  }
  return context;
}

