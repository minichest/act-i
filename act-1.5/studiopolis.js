const API_KEY = '502578770db455c118a3038b240e3f5c';
const USERNAME = 'last_aezi';

const BASE = `https://ws.audioscrobbler.com/2.0/?api_key=${API_KEY}&format=json&user=${USERNAME}`;

function encodeName(name) {
  return encodeURIComponent(name.replace(/ /g, '+'));
}   

const REPLACEMENT_BASE = "https://myspace.aezlo.com/replacement-pics";
const DEEZER_API = "https://api.deezer.com";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];

/* key modules */

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function deezerSearch(artistName) {
  return new Promise((resolve, reject) => {
    const callbackName = `deezer_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    script.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=1&output=jsonp&callback=${callbackName}`;
    window[callbackName] = (data) => {
      delete window[callbackName];
      script.remove();
      resolve(data);
    };
    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error("Deezer request failed"));
    };
    document.body.appendChild(script);
  });
}   

function getRelativeTime(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateNowPlaying(element) {
    let dotCount = 0;
    setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        element.textContent = 'now playing' + '.'.repeat(dotCount);
    }, 350);
}

/* main program */

async function getImage(artistName, lastFmImages, size = "small") {
  const slug = slugify(artistName);

  for (const ext of IMAGE_EXTENSIONS) {
    const replacementUrl = `${REPLACEMENT_BASE}/${slug}.${ext}`;
    try {
      const res = await fetch(replacementUrl, { method: "HEAD" });
      if (res.ok) return replacementUrl;
    } catch (e) {}
  }

  // Deezer fallback
    try {
        const data = await deezerSearch(artistName);
        if (data.data && data.data.length > 0) {
            return data.data[0].picture_big || data.data[0].picture_medium || data.data[0].picture_small;
        }
    } catch (e) {}   

  // Last.fm fallback
  if (!lastFmImages || !lastFmImages.length) return "";
  const img = lastFmImages.find(i => i.size === size) || lastFmImages[lastFmImages.length - 1];
  return img["#text"] || "";
}   

async function fetchLastFM(method, extra = "") {
  const res = await fetch(`${BASE}&method=${method}${extra}`);
  if (!res.ok) throw new Error(`Last.fm error: ${res.status}`);
  return res.json();
}

async function renderLeftBox() {
  const [recentData, topData] = await Promise.all([
    fetchLastFM("user.getrecenttracks", "&limit=10"),
    fetchLastFM("user.gettoptracks", "&limit=10&period=7day")
  ]);

  const recentTracks = recentData.recenttracks.track;
  const topTracks = topData.toptracks.track;

  document.getElementById("plays-container").innerHTML = `
    <h3>Recent Plays</h3>
    <ol class="track-list">
        ${(Array.isArray(recentTracks) ? recentTracks : [recentTracks]).map(t => {
        const artist = (t.artist && (t.artist["#text"] || t.artist.name)) || "Unknown";   
        let timestamp = 'now playing';
        let timestampClass = 'now-playing';
        if (t.date && t.date.uts) {
            timestamp = getRelativeTime(new Date(t.date.uts * 1000));
            timestampClass = '';
        }
        return `<li><a href="https://www.last.fm/music/${encodeName(artist)}/${encodeName(t.name)}" target="_blank"><span class="track-title">${escapeHtml(t.name)}</span></a><a href="https://www.last.fm/music/${encodeName(artist)}" target="_blank"><span class="track-artist">${escapeHtml(artist)}</span></a><span class="timestamp ${timestampClass}" data-now="${timestampClass === 'now-playing'}">${timestamp}</span></li>`;
        }).join("")}
    </ol>`;

    // Animate the now-playing dot
    const nowPlayingEl = document.querySelector('#plays-container .now-playing');
    if (nowPlayingEl) animateNowPlaying(nowPlayingEl);   

  document.getElementById("album-container").innerHTML = `
    <h3>Most Played (7 days)</h3>
    <ol class="track-list">
      ${(Array.isArray(topTracks) ? topTracks : [topTracks]).map(t => {
  const artist = t.artist["#text"] || t.artist.name || "Unknown";
  return `<li><a href="https://www.last.fm/music/${encodeName(artist)}/${encodeName(t.name)}" target="_blank"><span class="track-title">${t.name}</span></a><a href="https://www.last.fm/music/${encodeName(artist)}" target="_blank"><span class="track-artist">${artist}</span></a></li>`;
}).join("")}   
    </ol>`;
}

const ARTIST_MERGES = [
  { target: "digga d", sources: ["digga", "digga d"] },
  { target: "PinkPantheress", sources: ["vbw", "pinkpantheress"] }
];

function mergeArtists(artists) {
  const map = new Map();
  for (const a of artists) {
    const lower = a.name.toLowerCase();
    const merge = ARTIST_MERGES.find(m => m.sources.some(s => s.toLowerCase() === lower));
    if (merge) {
      const existing = map.get(merge.target);
      if (existing) {
        existing.playcount += parseInt(a.playcount) || 0;
      } else {
        map.set(merge.target, { ...a, name: merge.target, playcount: parseInt(a.playcount) || 0 });
      }
    } else {
      map.set(a.name, a);
    }
  }
  return [...map.values()].sort((a, b) => (parseInt(b.playcount) || 0) - (parseInt(a.playcount) || 0));
}

async function renderRightBox() {
  const data = await fetchLastFM("user.gettopartists", "&limit=9&period=7day");
  const artists = mergeArtists(Array.isArray(data.topartists.artist) ? data.topartists.artist : [data.topartists.artist]);

  const items = await Promise.all(artists.map(async a => {
    const img = await getImage(a.name, a.image);
    return `<li><img src="${img}" alt="" /><a href="https://www.last.fm/music/${encodeName(a.name)}" target="_blank"><span class="artist-name">${a.name}</span></a><span class="playcount">${a.playcount} scrobbles</span></li>`;
  }));

  document.getElementById("artists-container").innerHTML = `
    <h3>Top Artists (7 days)</h3>
    <ol class="artist-list">
      ${items.join("")}
    </ol>`;
}   

async function init() {
  try {
    await Promise.all([renderLeftBox(), renderRightBox()]);
  } catch (err) {
    console.error("Last.fm fetch failed:", err);
  }
}

init();   