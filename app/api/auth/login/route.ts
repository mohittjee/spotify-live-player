import { NextResponse } from 'next/server';
import { stringify } from 'querystring';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const state = Math.random().toString(36).substring(2, 18);
  const scope = 'user-read-currently-playing user-top-read';

  const params = stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: 'http://127.0.0.1:3000/api/auth/callback',
    state,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}