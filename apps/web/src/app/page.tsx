'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { AuthShell } from '@/components/layout/AuthShell';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(token ? '/analysis' : '/login');
    }
  }, [loading, token, router]);

  return (
    <AuthShell>
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary ring-1 ring-primary/20">
            <Loader2 size={20} aria-hidden="true" className="animate-spin" />
          </span>
          <div className="text-lg font-semibold">{loading ? 'Checking your session...' : 'Redirecting...'}</div>
          <div className="text-sm text-muted-foreground">Preparing your pension dashboard.</div>
        </div>
      </Card>
    </AuthShell>
  );
}
