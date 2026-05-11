import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { getLocalCurrentUser, setLocalCurrentUser, initLocalData } from '../services/localStorage';
import { getUsers as getStorageUsers } from '../services/storage';

interface AuthContextType {
  user: User | null;
  users: User[];
  loginAsUser: (userId: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initLocalData();
    getStorageUsers().then((loaded) => {
      setUsers(loaded);
      const saved = getLocalCurrentUser();
      if (saved) {
        const fresh = loaded.find((u) => u.id === saved.id);
        setUser(fresh || null);
      }
      setLoading(false);
    });
  }, []);

  const loginAsUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      setLocalCurrentUser(found);
    }
  };

  const logout = () => {
    setUser(null);
    setLocalCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        loginAsUser,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
