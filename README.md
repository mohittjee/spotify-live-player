Spotify Live Player 🎵

Welcome to the Spotify Live Player, a Next.js application that integrates with the Spotify API to showcase your currently playing song, top album, and artist track count in a sleek, responsive UI. With real-time updates, dynamic background colors, and robust error handling, it’s perfect for music lovers who want to display their listening habits.
✨ Features

Real-Time Song Updates: Displays your currently playing song with a progress bar, updated every ~1 second for Spotify Premium users.
Top Album Showcase: Highlights your most-played album and artist track count, refreshed every ~3 seconds.
Dynamic Background: Extracts the dominant color from album artwork to style the card’s background.
Fallback Mechanism: Shows “Selfless” by Strokes with a default cover image if no song is playing or data fails to load within 5 seconds.
Non-Premium Support: Gracefully handles non-Premium accounts by displaying the top album or fallback.
Responsive UI: Built with Shadcn/UI and Tailwind CSS, featuring a modern card layout with custom fonts (nHassDisplay, SpaceGrotesk).
Error Handling: Includes retry logic and caching for failed API requests (e.g., invalid album IDs).
Cross-Origin Compatibility: Configured for Next.js development with allowedDevOrigins.

📋 Prerequisites
Before you begin, ensure you have:

Node.js: Version 18.x or higher (LTS recommended). Download
npm: Version 8.x or higher (included with Node.js).
Spotify Account: A Spotify account (Premium recommended for real-time playback).
Spotify Developer Account: To create an app and obtain API credentials. Sign up
Git: For cloning the repository. Install

🚀 Setup Instructions
1. Clone the Repository
git clone https://github.com/your-username/spotify-now-playing.git
cd spotify-now-playing

Note: Replace your-username with your GitHub username or the actual repository URL.
2. Install Dependencies
Install Node.js packages:
npm install

Key dependencies:

next: For server-side rendering and API routes.
@tanstack/react-query: For data fetching and polling.
axios: For Spotify API requests.
node-cache: For caching API responses.
react-icons: For Spotify and trophy icons.
shadcn/ui: For the card component.
tailwindcss: For styling.

Install the Shadcn/UI card component:
npx shadcn-ui@latest add card

3. Configure Spotify API Credentials

Create a Spotify App:

Visit the Spotify Developer Dashboard.
Click Create an App, provide a name and description, and note the Client ID and Client Secret.
Set the Redirect URI to http://localhost:3000/api/auth/callback for development (or your production URL).


Set Environment Variables:

Create a .env.local file in the project root:
touch .env.local


Add the following:
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
AUTH_SECRET=your_random_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token //will be obtained after authentication


Replace your_client_id and your_client_secret with your Spotify App credentials.

Generate a random AUTH_SECRET (e.g., openssl rand -base64 32).

Leave SPOTIFY_REFRESH_TOKEN empty for now; you’ll obtain it during authentication.




4. Set Up Fonts
The app uses custom fonts (nHassDisplay, SpaceGrotesk):

Place font files in public/fonts/:

Download nHassDisplay-Regular.woff2 and SpaceGrotesk-Regular.woff2 (or source from a font provider).

Create the directory:
mkdir -p public/fonts


Move the .woff2 files to public/fonts/.



Verify app/globals.css:
@font-face {
  font-family: 'nHassDisplay';
  src: url('/fonts/nHassDisplay-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'SpaceGrotesk';
  src: url('/fonts/SpaceGrotesk-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}


Fallback Option: If fonts are unavailable, update app/page.tsx to use Next.js default fonts:
className="text-base font-geist-sans font-medium truncate hover:underline"
className="text-xs text-gray-400 font-geist-mono truncate"



5. Add Placeholder Image
Ensure the fallback album cover exists:

Place musicCover.png in public/ (e.g., a 300x300 PNG image).

Verify the path in app/page.tsx:
src={track?.albumImage || topAlbum?.albumImage || '/musicCover.png'}



6. Run the Development Server
Start the Next.js server:
npm run dev

The app will be available at http://localhost:3000.
7. Authenticate with Spotify

Visit http://localhost:3000/api/auth/login?secret=your_random_secret (replace your_random_secret with AUTH_SECRET from .env.local).

Log in to Spotify and authorize the app.

You’ll be redirected to /api/auth/callback, which returns a refresh_token.

Copy the refresh_token from the URL or response and add it to .env.local:
SPOTIFY_REFRESH_TOKEN=your_refresh_token


Restart the server:
npm run dev



8. Verify the App

Open http://localhost:3000.
Premium Users (Playing a Song): See “Listening Now” with song name, artist, album image, and progress bar, updating every ~1 second.
No Song Playing: See “Top Album” with your most-played album and artist track count.
Loading Failure (after 5 seconds): See “Music Rec” with “Selfless” by Strokes and musicCover.png.
Non-Premium Users: See “Top Album” or “Music Rec” if no top album data is available.

🌐 Deployment
To deploy on Vercel (or similar platforms):

Push to GitHub:
git add .
git commit -m "Initial commit"
git push origin main


Deploy to Vercel:

Import the repository in Vercel.
Set environment variables in Vercel’s dashboard:
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
AUTH_SECRET
SPOTIFY_REFRESH_TOKEN


Update the Spotify App’s Redirect URI to https://your-vercel-app.vercel.app/api/auth/callback.
Deploy the app.


Verify Production:

Visit your deployed URL (e.g., https://your-vercel-app.vercel.app).
Ensure song updates, top album display, and fallback work as expected.



📂 Project Structure
├── app/
│   ├── api/spotify/[endpoint]/route.ts  # Spotify API routes
│   ├── page.tsx                        # Main page with UI and data fetching
│   ├── providers.tsx                   # Tanstack Query configuration
│   ├── globals.css                     # Tailwind CSS and fonts
│   ├── auth-callback/page.tsx          # Spotify auth callback
├── public/
│   ├── fonts/                          # nHassDisplay, SpaceGrotesk fonts
│   ├── musicCover.png                  # Fallback album cover
├── next.config.js                      # Next.js configuration
├── README.md                           # This file

🛠️ Troubleshooting

Song Updates Are Slow:

Check logs for /api/spotify/currently-playing (should be ~1000ms intervals).

Inspect console for fetchCurrentTrack took Xms (in app/page.tsx).

If >1000ms, adjust refetchInterval in app/page.tsx:
refetchInterval: 1200,
staleTime: 1200,




404 Errors for Albums:

Check logs for Resource not found for https://api.spotify.com/v1/albums/....

Verify top track’s album ID:
console.log('Top Track Album ID:', topTrack?.album.id);


Ensure failedAlbumIds cache skips repeated 404s:
console.log('Failed Album IDs:', Array.from(failedAlbumIds));




Cross-Origin Warning:

Ensure next.config.js includes:
allowedDevOrigins: ['http://127.0.0.1:3000', 'http://localhost:3000']


Restart server: npm run dev.



Authentication Slow:

Check logs for /auth-callback response time.

Add timing logs to @/lib/spotify.ts:
console.log(`getAccessToken took ${Date.now() - start}ms`);


Test Spotify’s token endpoint:
curl -X POST https://accounts.spotify.com/api/token




Rate Limit Errors (429):

Check logs:
grep "429" next.log


Increase refetchInterval for fetchTopAlbumData in app/page.tsx:
refetchInterval: 4000,
staleTime: 4000,




Fonts Missing:

Ensure public/fonts/nHassDisplay-Regular.woff2 and SpaceGrotesk-Regular.woff2 exist.
Fallback to font-geist-sans/font-geist-mono in app/page.tsx.



🤝 Contributing
We welcome contributions! To get started:

Fork the repository.
Create a branch: git checkout -b feature/your-feature.
Commit changes: git commit -m "Add your feature".
Push to the branch: git push origin feature/your-feature.
Open a Pull Request.

Please follow the Code of Conduct and ensure tests pass:
npm run test

📜 License
This project is licensed under the MIT License.
📬 Contact
For issues or questions, open a GitHub Issue.
Happy listening! 🎧
