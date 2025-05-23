'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaCopy } from 'react-icons/fa';
import Link from 'next/link';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const refreshToken = searchParams.get('refresh_token');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (refreshToken) {
      try {
        await navigator.clipboard.writeText(refreshToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Spotify Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        {refreshToken ? (
          <div>
            <p className="mb-2">
              Please copy the refresh token below and add it to your{' '}
              <code>.env.local</code> file as{' '}
              <code>SPOTIFY_REFRESH_TOKEN</code>:
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-200 p-2 rounded break-all">
                {refreshToken}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Copy to clipboard"
              >
                <FaCopy />
              </button>
            </div>
            {copied && <p className="text-green-600 mt-2">Copied to clipboard!</p>}
            <p className="mt-4">
              After adding the token, visit{' '}
              <Link href="/" className="text-blue-600 hover:underline">
                the home page
              </Link>
              .
            </p>
          </div>
        ) : (
          <p>
            Error: No refresh token received. Please try authenticating again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AuthCallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCallbackContent />
      </Suspense>
    </main>
  );
}