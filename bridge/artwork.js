const fetch = require("node-fetch");

const cache = new Map(); // albumKey → base64 url

async function fetchFromItunesApi(artist, album) {
  const key = `${artist}__${album}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const query = encodeURIComponent(`${artist} ${album}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=1`,
      { timeout: 5000 }
    );
    const data = await res.json();
    if (data.results?.length > 0) {
      const url = data.results[0].artworkUrl100.replace("100x100", "300x300");
      cache.set(key, url);
      return url;
    }
  } catch {}
  cache.set(key, null);
  return null;
}

async function preloadArtwork(tracks, limit = 50) {
  // Deduplicate by album
  const albums = [];
  const seen = new Set();
  for (const t of tracks) {
    const key = `${t.artist}__${t.album}`;
    if (!seen.has(key)) {
      seen.add(key);
      albums.push({ artist: t.artist, album: t.album });
    }
    if (albums.length >= limit) break;
  }

  console.log(`[artwork] Preloading ${albums.length} album covers...`);
  await Promise.all(
    albums.map(({ artist, album }) => fetchFromItunesApi(artist, album))
  );
  console.log(`[artwork] Preload done. ${cache.size} covers cached.`);
}

module.exports = { fetchFromItunesApi, preloadArtwork, cache };
