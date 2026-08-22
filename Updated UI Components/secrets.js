// ─────────────────────────────────────────────────────────────────────────────
// Spotify credentials.
//
// ⚠ READ THIS: anything in this file ships to the browser and is readable by
// anyone who opens the page. The PKCE flow this app uses needs ONLY the client
// id — the client secret below is NOT used anywhere in the code and does not
// need to be here. Rotate it in the Spotify dashboard and delete it from this
// file when you get the chance.
//
// Dashboard → your app → Settings → Redirect URIs must contain the exact value
// of REDIRECT (log it from the console if unsure: window.SPOTIFY.REDIRECT).
// ─────────────────────────────────────────────────────────────────────────────
window.SPOTIFY = {
  CLIENT_ID: '765e26aab4c24d08be71d76b824910ad',
  // Client secret and account email removed before this went public — the
  // embed player this app actually uses (see SPOTIFY_ID in the main script)
  // needs only a public playlist id, never a secret or an access token.
  PLAYLIST_ID: '7Mb4FGvrQAudgOQAWC6nBj',
  REDIRECT: window.location.origin + window.location.pathname,
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private'
  ].join(' ')
};
