import axios from 'axios';
import { stringify } from 'querystring';

let accessToken: string | null = null;
let expiresAt: number | null = null;

export function setAccessToken(token: string, expiresIn: number) {
  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000 - 60000;
}

export async function getAccessToken(): Promise<string | null> {
  if (!process.env.SPOTIFY_REFRESH_TOKEN) return null;

  if (!accessToken || !expiresAt || Date.now() >= expiresAt) {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        stringify({
          grant_type: 'refresh_token',
          refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
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
      accessToken = response.data.access_token;
      expiresAt = Date.now() + response.data.expires_in * 1000 - 60000;
    } catch (err) {
      console.error('Error refreshing token:', err);
      accessToken = null;
      expiresAt = null;
      return null;
    }
  }

  return accessToken;
}