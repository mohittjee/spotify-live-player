'use client';

import { useQuery } from '@tanstack/react-query';
import axios, { isAxiosError } from 'axios';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { FaSpotify, FaTrophy } from 'react-icons/fa';
import { useEffect, useState } from 'react';

interface SpotifyTrack {
  name: string;
  artists: [{ name: string }];
  album: { name: string; images: [{ url: string }]; album_type: string; id: string };
  external_urls: { spotify: string };
  duration_ms: number;
  progress_ms?: number;
}

interface SpotifyAlbum {
  name: string;
  artists: [{ name: string }];
  images: [{ url: string }];
  external_urls: { spotify: string };
}

interface CurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack;
  timestamp: number;
  progress_ms: number;
}

interface SpotifyData {
  currentTrack: CurrentlyPlaying | null;
  topAlbum: SpotifyAlbum | null;
  artistTrackCount: number;
}

const fetchCurrentTrack = async (): Promise<CurrentlyPlaying | null> => {
  try {
    const currentRes = await axios.get('/api/spotify/currently-playing');
    return currentRes.data as CurrentlyPlaying | null;
  } catch (err: unknown) {
    if (isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 400)) {
      return null; // Non-Premium users
    }
    throw err; // other errors
  }
};

const fetchTopAlbumData = async (): Promise<{ topAlbum: SpotifyAlbum | null; artistTrackCount: number }> => {
  // Fetch top track to get the most played album
  const topTrackRes = await axios.get('/api/spotify/top-track');
  const topTrack = topTrackRes.data[0] as SpotifyTrack | null;

  const topTracksRes = await axios.get('/api/spotify/top-tracks');
  const topTracks = topTracksRes.data as SpotifyTrack[];

  let topAlbum: SpotifyAlbum | null = null;
  let artistTrackCount = 0;

  if (topTrack) {
    try {
      const albumRes = await axios.get(`/api/spotify/album/${topTrack.album.id}`);
      topAlbum = {
        name: albumRes.data.name,
        artists: albumRes.data.artists,
        images: albumRes.data.images,
        external_urls: albumRes.data.external_urls,
      };
    } catch {
      // Fallback to track's album data if album fetch fails
      topAlbum = {
        name: topTrack.album.name,
        artists: topTrack.artists,
        images: topTrack.album.images,
        external_urls: { spotify: topTrack.external_urls.spotify },
      };
    }

    // Count tracks by the top track's artist
    const topArtistName = topTrack.artists[0].name;
    artistTrackCount = topTracks.filter((track) =>
      track.artists.some((artist) => artist.name === topArtistName)
    ).length;
  }

  return { topAlbum, artistTrackCount };
};

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function Home() {
  // Fetch current track every 1 second
  const { data: currentTrack, isLoading: isCurrentLoading, error: currentError } = useQuery({
    queryKey: ['spotifyCurrentTrack'],
    queryFn: fetchCurrentTrack,
    refetchInterval: 1000,
    staleTime: 1000,
    retry: 2,
    retryDelay: 500,
  });

  // Fetch top album data every 3 seconds
  const { data: topAlbumData, isLoading: isTopAlbumLoading, error: topAlbumError } = useQuery({
    queryKey: ['spotifyTopAlbum'],
    queryFn: fetchTopAlbumData,
    refetchInterval: 3000,
    staleTime: 3000,
    retry: 2,
    retryDelay: 500,
  });

  const [progressMs, setProgressMs] = useState<number | undefined>(undefined);
  const [bgColor, setBgColor] = useState('rgb(5, 46, 22)');
  const [showFallback, setShowFallback] = useState(false);

  const data: SpotifyData = {
    currentTrack: currentTrack ?? null,
    topAlbum: topAlbumData?.topAlbum || null,
    artistTrackCount: topAlbumData?.artistTrackCount || 0,
  };

  // Handle loading timeout (5 seconds)
  useEffect(() => {
    if ((isCurrentLoading || isTopAlbumLoading) && !data.currentTrack && !data.topAlbum) {
      const timeout = setTimeout(() => {
        setShowFallback(true);
      }, 5000);
      return () => clearTimeout(timeout);
    } else {
      setShowFallback(false);
    }
  }, [isCurrentLoading, isTopAlbumLoading, data.currentTrack, data.topAlbum]);

  // Extract dominant color from album cover
  useEffect(() => {
    const albumImage = data.currentTrack?.is_playing
      ? data.currentTrack.item.album.images[0]?.url
      : data.topAlbum?.images[0]?.url;
    if (!albumImage) {
      setBgColor('rgb(5, 46, 22)'); // Default color
      return;
    }

    const extractColor = async () => {
      try {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = albumImage;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let r = 0, g = 0, b = 0;
          let pixelCount = 0;

          for (let i = 0; i < data.length; i += 20) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            pixelCount++;
          }

          r = Math.floor(r / pixelCount);
          g = Math.floor(g / pixelCount);
          b = Math.floor(b / pixelCount);

          r = Math.floor(r * 0.5);
          g = Math.floor(g * 0.5);
          b = Math.floor(b * 0.5);

          setBgColor(`rgb(${r}, ${g}, ${b})`);
        };
      } catch (error) {
        console.error('Error extracting color from album art:', error);
        setBgColor('rgb(5, 46, 22)'); // Fallback to default
      }
    };

    extractColor();
  }, [data.currentTrack?.is_playing, data.currentTrack?.item.album.images, data.topAlbum?.images]);

  const track = data.currentTrack?.is_playing
    ? {
      name: data.currentTrack.item.name,
      artist: data.currentTrack.item.artists[0].name,
      albumImage: data.currentTrack.item.album.images[0]?.url,
      externalUrl: data.currentTrack.item.external_urls.spotify,
      progressMs: progressMs ?? data.currentTrack.progress_ms,
      durationMs: data.currentTrack.item.duration_ms,
    }
    : null;
  const topAlbum = data.topAlbum
    ? {
      name: data.topAlbum.name,
      artist: data.topAlbum.artists[0].name,
      albumImage: data.topAlbum.images[0]?.url,
      externalUrl: data.topAlbum.external_urls.spotify,
    }
    : null;
  const topArtistTrackCount = data.artistTrackCount;

  // Update progress timer for currently playing track
  useEffect(() => {
    if (data.currentTrack?.is_playing) {
      setProgressMs(data.currentTrack.progress_ms);
      const interval = setInterval(() => {
        setProgressMs((prev) => {
          if (prev === undefined || !data.currentTrack) return prev;
          const newProgress = prev + 1000;
          return newProgress <= data.currentTrack.item.duration_ms ? newProgress : prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setProgressMs(undefined);
    }
  }, [data.currentTrack]);

  return (
    <Card
      className="relative flex flex-col w-full h-full max-h-[9.3rem] rounded-lg m-0 p-2 gap-2 shadow-[inset_0px_60px_100px_-50px_#ffffff10]"
      style={{
        backgroundColor: bgColor,
        transition: 'background-color 1s ease'
      }}
    >
      <div className="text-sm flex justify-between font-medium">
        <span>
          {track
            ? 'Listening Now'
            : topAlbum && !showFallback && !currentError && !topAlbumError
              ? 'Top Album'
              : 'Music Rec'}
        </span>
        <span>
          <FaSpotify className="opacity-60" />
        </span>
      </div>
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="relative flex items-center min-w-8 h-auto aspect-square max-w-24 max-h-24">
          <Image
            src={track?.albumImage || topAlbum?.albumImage || '/musicCover.png'}
            alt="Album cover"
            fill
            className="object-cover rounded-md border transition-opacity duration-2000"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          {(isCurrentLoading || isTopAlbumLoading) && !showFallback && !data.currentTrack && !data.topAlbum ? (
            <div className="text-base font-nHassDisplay font-medium truncate">
              Loading...
            </div>
          ) : track ? (
            <>
              <a
                href={track.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-nHassDisplay font-medium truncate hover:underline"
              >
                {track.name}
              </a>
              <div className="text-xs text-gray-400 font-SpaceGrotesk truncate">
                {track.artist}
              </div>
              <div className="flex items-center gap-2 font-SpaceGrotesk mt-1">
                <div className="text-xs text-left text-gray-400 w-8">
                  {formatTime(track.progressMs)}
                </div>
                <div className="relative h-1 flex-1 bg-gray-600 rounded-full">
                  <div
                    className="absolute h-1 bg-white rounded-full"
                    style={{ width: `${(track.progressMs / track.durationMs) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-right text-gray-400 w-8">
                  {formatTime(track.durationMs)}
                </div>
              </div>
            </>
          ) : topAlbum && !showFallback && !currentError && !topAlbumError ? (
            <>
              <a
                href={topAlbum.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-nHassDisplay font-medium truncate hover:underline"
              >
                {topAlbum.name}
              </a>
              <div className="text-xs text-gray-400 font-SpaceGrotesk truncate">
                {topAlbum.artist}
              </div>
              <div className="flex items-center gap-2 font-SpaceGrotesk mt-1">
                <div className="text-xs text-gray-400">
                  <FaTrophy className="inline mr-1 my-0.5" />
                  Top artist - {topArtistTrackCount} tracks this week
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-base font-nHassDisplay font-medium truncate">
                <Link
                  href="https://open.spotify.com/track/2t0wwvR15fc3K1ey8OiOaN"
                  target="_blank"
                  className="hover:underline"
                >
                  Selfless
                </Link>
              </div>
              <div className="text-xs text-gray-400 font-SpaceGrotesk truncate">
                By Strokes (2020)
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}