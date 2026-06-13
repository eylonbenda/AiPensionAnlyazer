'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiUploadDocument } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { RequireAuth } from '@/components/RequireAuth';

function UploadForm() {
  const router = useRouter();
  const { token } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const acceptedText = useMemo(() => 'PDF only (.pdf)', []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Not authenticated');
      return;
    }
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiUploadDocument(token, file);
      localStorage.setItem('last_document_id', result.documentId);
      localStorage.setItem('last_job_id', result.jobId);
      router.replace(`/analysis?documentId=${encodeURIComponent(result.documentId)}&jobId=${encodeURIComponent(result.jobId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <div className="mb-1 text-2xl font-semibold">Upload pension report</div>
          <div className="text-sm text-muted-foreground">
            Upload your latest pension statement PDF. We will process it asynchronously and then show your plan,
            projection, checks, and tasks.
          </div>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pension-pdf">Pension PDF</Label>
              <Input
                id="pension-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-muted-foreground">{acceptedText}</div>
            </div>

            {error ? (
              <Alert variant="destructive" className="mt-1">
                <AlertTitle>Upload issue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex gap-3 pt-2">
              <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Uploading...' : 'Upload & analyze'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <RequireAuth>
      <UploadForm />
    </RequireAuth>
  );
}

