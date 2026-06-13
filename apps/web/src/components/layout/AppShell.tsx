'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, FileText } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { Button } from '@/components/ui/button';

const SHELL_COPY = {
  en: {
    tagline: 'Waze for Pension',
    analysis: 'Analysis',
    upload: 'Upload',
    logout: 'Logout',
    login: 'Login',
    languageToggle: 'עברית',
  },
  he: {
    tagline: 'Waze לפנסיה',
    analysis: 'ניתוח',
    upload: 'העלאה',
    logout: 'התנתקות',
    login: 'התחברות',
    languageToggle: 'English',
  },
} as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { locale, toggle, dir } = useLocale();
  const t = SHELL_COPY[locale];

  function onLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/analysis" className="flex items-center gap-3 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <FileText size={18} aria-hidden="true" />
            </span>
            <span className="leading-tight">
              Pension AI Analyzer
              <span className="mx-2 hidden text-xs font-normal text-muted-foreground sm:inline">{t.tagline}</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggle} type="button">
              {t.languageToggle}
            </Button>
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={() => router.push('/analysis')} type="button">
                  {t.analysis}
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/documents/new')} type="button">
                  {t.upload}
                </Button>
                <Button variant="ghost" size="sm" onClick={onLogout} type="button">
                  <LogOut size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/login')} type="button">
                {t.login}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

