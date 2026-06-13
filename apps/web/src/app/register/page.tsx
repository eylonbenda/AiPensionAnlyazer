'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/layout/AuthShell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { token, loading, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      router.replace('/analysis');
    }
  }, [loading, token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, name: name.trim() ? name : undefined });
      router.replace('/analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <div className="mb-1 text-2xl font-semibold">Create account</div>
          <div className="text-sm text-muted-foreground">Upload a pension report and view your analysis.</div>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1">
              <Label htmlFor="name">Name (optional)</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <Alert variant="destructive" className="mt-1">
                <AlertTitle>Sign up failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button variant="primary" type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create account'}
            </Button>

            <Button variant="link" type="button" onClick={() => router.push('/login')} className="w-full">
              Back to login
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

