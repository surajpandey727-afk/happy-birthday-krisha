/** Spotify soundtrack configuration. Reads NEXT_PUBLIC_SPOTIFY_PLAYLIST_URI
 * (a full "spotify:playlist:ID" URI or a share URL) — unset means the
 * floating player renders its graceful "not configured yet" state instead
 * of a broken embed. No secrets live here: the public embed iframe needs
 * only a playlist id, never a client secret or access token. */

function extractPlaylistId(value: string | undefined): string | null {
  if (!value) return null;
  const uriMatch = value.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  const urlMatch = value.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // bare id
  if (/^[a-zA-Z0-9]{10,}$/.test(value.trim())) return value.trim();
  return null;
}

const playlistId = extractPlaylistId(process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URI);

export const spotifyConfig = {
  configured: playlistId !== null,
  playlistId,
  playlistUri: playlistId ? `spotify:playlist:${playlistId}` : null,
  openUrl: playlistId ? `https://open.spotify.com/playlist/${playlistId}` : null,
};
