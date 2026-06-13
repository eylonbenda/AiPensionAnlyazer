import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText } from 'lucide-react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary ring-1 ring-primary/20">
              <FileText size={20} aria-hidden="true" />
            </span>
            <div className="text-center">
              <div className="text-lg font-semibold">Pension AI Analyzer</div>
              <div className="text-sm text-muted-foreground">Waze for Pension readiness</div>
            </div>
          </div>

          <div className="mb-6 rounded-[var(--radius)] border border-border/60 bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-medium">Private, structured analysis</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  We extract key pension fields from your PDF and translate them into neutral “things to check”.
                </div>
              </div>
            </div>
          </div>

          {children}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Need access?{' '}
            <Link className="font-medium text-primary underline underline-offset-4" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

