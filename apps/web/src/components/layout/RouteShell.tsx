'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { AppShell } from './AppShell';
import { AuthShell } from './AuthShell';

export function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/documents') || pathname.startsWith('/analysis')) {
    return <AppShell>{children}</AppShell>;
  }

  if (pathname === '/login' || pathname === '/register') {
    return <AuthShell>{children}</AuthShell>;
  }

  return <>{children}</>;
}

