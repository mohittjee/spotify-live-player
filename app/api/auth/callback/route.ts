import { NextResponse } from 'next/server';
import axios from 'axios';
import { stringify } from 'querystring';
import { setAccessToken } from '@/lib/spotify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://127.0.0.1:3000/api/auth/callback',
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    setAccessToken(access_token, expires_in);
    return NextResponse.redirect(
      `http://127.0.0.1:3000/auth-callback?refresh_token=${encodeURIComponent(refresh_token)}`
    );
  } catch {
    return NextResponse.json({ error: 'Error exchanging code' }, { status: 500 });
  }
}