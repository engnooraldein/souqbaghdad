import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: User[] = [
  {
    id: 'admin-001',
    name: 'أحمد المشرف',
    email: 'admin@souqbaghdad.com',
    phone: '07701234567',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
    isVerified: true,
    createdAt: '2024-01-01',
    stats: { ads: 0, favorites: 0, views: 0 },
  },
  {
    id: 'user-001',
    name: 'محمد العاني',
    email: 'mohammed@example.com',
    phone: '07709876543',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=User1',
    isVerified: true,
    createdAt: '2024-02-15',
    stats: { ads: 12, favorites: 45, views: 890 },
  },
  {
    id: 'vendor-001',
    name: 'سارة الحميداوي',
    email: 'sara@example.com',
    phone: '07705555555',
    role: 'vendor',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Vendor1',
    isVerified: true,
    storeName: 'متجر سارة للإلكترونيات',
    createdAt: '2024-03-01',
    stats: { ads: 156, favorites: 234, views: 15600 },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('souqBaghdad_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('souqBaghdad_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('souqBaghdad_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('souqBaghdad_user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo login - accept any email with password "demo123"
    if (password === 'demo123') {
      const foundUser = demoUsers.find(u => u.email === email) || {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        phone: '',
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        isVerified: false,
        createdAt: new Date().toISOString().split('T')[0],
        stats: { ads: 0, favorites: 0, views: 0 },
      };
      setUser(foundUser);
      return true;
    }

    return false;
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      isVerified: false,
      createdAt: new Date().toISOString().split('T')[0],
      stats: { ads: 0, favorites: 0, views: 0 },
    };

    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('souqBaghdad_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const demoLogin = () => {
    setUser(demoUsers[0]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      demoLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}