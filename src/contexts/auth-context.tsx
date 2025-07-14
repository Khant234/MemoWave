
'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  React.useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname);
      if (!user && !isPublicRoute) {
        router.push('/login');
      } else if (user && isPublicRoute) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  if (isLoading || (!user && !publicRoutes.includes(pathname))) {
    // You can render a global loading spinner here
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
