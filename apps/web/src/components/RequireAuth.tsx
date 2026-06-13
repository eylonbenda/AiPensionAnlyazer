'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [loading, token, router]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!token) {
    return <div className="p-6">Redirecting...</div>;
  }

  return <>{children}</>;
}

