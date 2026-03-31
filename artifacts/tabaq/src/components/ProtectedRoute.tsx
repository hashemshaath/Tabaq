import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOwner?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireOwner = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/signin');
    }
    if (!isLoading && isAuthenticated && requireAdmin && !user?.isAdmin) {
      setLocation('/');
    }
    if (!isLoading && isAuthenticated && requireOwner && !user?.isOwner && !user?.isAdmin) {
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, user, requireAdmin, requireOwner, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireAdmin && !user?.isAdmin) return null;
  if (requireOwner && !user?.isOwner && !user?.isAdmin) return null;

  return <>{children}</>;
}
