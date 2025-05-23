import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';
import { getAccessToken } from '@/lib/spotify';

const cache = new NodeCache();

export async function GET(request: Request, { params }: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await params;
  const cacheKey = `spotify-${endpoint}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let url = '';
  let ttl = 3;
  if (endpoint === 'currently-playing') {
    url = 'https://api.spotify.com/v1/me/player/currently-playing';
    ttl = 1; // 1-second TTL for currently-playing
  } else if (endpoint === 'top-track') {
    url = 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1';
  } else if (endpoint === 'top-tracks') {
    url = 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50';
  } else if (endpoint.startsWith('album/')) {
    const albumId = endpoint.split('/')[1];
    if (!albumId) {
      return NextResponse.json({ error: 'Invalid album ID' }, { status: 400 });
    }
    url = `https://api.spotify.com/v1/albums/${albumId}`;
  } else {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = endpoint === 'top-track' || endpoint === 'top-tracks'
      ? response.data.items || []
      : response.data || null;
    cache.set(cacheKey, data, ttl);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const status = err instanceof AxiosError ? err.response?.status || 500 : 500;
    return NextResponse.json({ error: 'Error fetching data' }, { status });
  }
}