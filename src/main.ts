// ===== Music45 Main Application =====

import type {
  Song,
  Album,
  QueueItem,
  QualitySetting,
  PlayerElements,
  LyricsLine,
  SeekEvent,
  HistoryState,
} from "./types";

import {
  escapeHtml,
  getTitle,
  getArtist,
  getCover,
  formatTime,
  extractPlayableUrl,
  isMobileDevice,
  generateQueueItemKey,
  songToQueueItem,
  calculateSeekPosition,
  getGreeting,
  FALLBACK_COVER,
} from "./utils/helpers";

import {
  searchSongs,
  getSongDetails,
  getAlbumDetails,
  getSongSuggestions,
  loadAlbumsFromQueries,
  getMultipleAlbumDetails,
} from "./services/api";

import {
  loadRecentlyPlayed,
  saveRecentlyPlayed,
  addToRecentlyPlayed,
  loadQualitySetting,
  saveQualitySetting,
} from "./services/storage";

import {
  getLyrics,
  parseLrcLyrics,
  findActiveLine,
  getBestLyrics,
} from "./services/lyrics";

// ===== Application State =====

interface AppState {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  recentlyPlayed: QueueItem[];
  shuffleMode: boolean;
  repeatMode: boolean;
  qualitySetting: QualitySetting;
  parsedLyrics: LyricsLine[];
  isSeeking: boolean;
}

const state: AppState = {
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  recentlyPlayed: [],
  shuffleMode: false,
  repeatMode: false,
  qualitySetting: "auto",
  parsedLyrics: [],
  isSeeking: false,
};

// ===== DOM Elements =====

let elements: PlayerElements;

// ===== Lucide Icons Initialization =====

function refreshIcons(): void {
  try {
    if (typeof (window as any).lucide !== "undefined") {
      (window as any).lucide.createIcons();
      console.log("Lucide icons initialized");
    }
  } catch (e) {
    console.error("Failed to initialize Lucide icons:", e);
  }
}

// ===== DOM Element Initialization =====

function initializeElements(): void {
  elements = {
    audio: document.getElementById("audio") as HTMLAudioElement,
    compactFooter: document.getElementById("compact-footer"),
    footerTrackImage: document.getElementById(
      "footer-track-image",
    ) as HTMLImageElement | null,
    footerTrackTitle: document.getElementById("footer-track-title"),
    footerTrackArtist: document.getElementById("footer-track-artist"),
    footerPlayBtn: document.getElementById("footer-btn-play"),
    footerPlayIcon: document.getElementById("footer-play-icon"),
    footerNextBtn: document.getElementById("footer-btn-next"),
    footerProgressFill: document.getElementById("footer-progress-fill"),
    musicBanner: document.getElementById("music-banner"),
    bannerCover: document.getElementById(
      "banner-cover-image",
    ) as HTMLImageElement | null,
    bannerTitle: document.getElementById("banner-song-title"),
    bannerArtist: document.getElementById("banner-artist-name"),
    bannerPlayPauseBtn: document.getElementById("banner-play-pause"),
    bannerPlayIcon: document.getElementById("banner-play-icon"),
    bannerPrev: document.getElementById("banner-prev"),
    bannerNext: document.getElementById("banner-next"),
    bannerProgressTrack: document.getElementById("banner-progress-track"),
    bannerProgressFill: document.getElementById("banner-progress-fill"),
    bannerProgressHandle: document.getElementById("progress-handle-circle"),
    currentTimeEl: document.getElementById("current-time"),
    durationEl: document.getElementById("duration"),
    lyricsContainer: document.getElementById("lyrics-container"),
    lyricsText: document.getElementById("lyrics-text"),
    flipInner: document.getElementById("flip-inner"),
    shuffleBtn: document.getElementById("shuffle-btn"),
    repeatBtn: document.getElementById("repeat-btn"),
    shufflePopup: document.getElementById("shuffle-popup"),
    repeatPopup: document.getElementById("repeat-popup"),
    shuffleStatus: document.getElementById("shuffle-status"),
    repeatStatus: document.getElementById("repeat-status"),
  };
}

// ===== UI Update Functions =====

function updateUI(item: QueueItem | null, playing: boolean): void {
  const cover = item?.cover || FALLBACK_COVER;
  const title = item?.title || "No song";
  const artist = item?.artist || "—";

  // Update compact footer
  if (elements.footerTrackImage) elements.footerTrackImage.src = cover;
  if (elements.footerTrackTitle) elements.footerTrackTitle.textContent = title;
  if (elements.footerTrackArtist)
    elements.footerTrackArtist.textContent = artist;
  if (elements.footerPlayBtn) {
    elements.footerPlayBtn.innerHTML = playing
      ? '<i data-lucide="pause"></i>'
      : '<i data-lucide="play"></i>';
  }

  // Show/hide compact footer
  if (elements.compactFooter) {
    if (item && title !== "No song") {
      elements.compactFooter.style.display = "flex";
      elements.compactFooter.classList.add("active");
    } else {
      elements.compactFooter.style.display = "none";
      elements.compactFooter.classList.remove("active");
    }
  }

  // Update music banner
  if (elements.bannerCover) elements.bannerCover.src = cover;
  if (elements.bannerTitle) elements.bannerTitle.textContent = title;
  if (elements.bannerArtist) elements.bannerArtist.textContent = artist;
  if (elements.bannerPlayPauseBtn) {
    elements.bannerPlayPauseBtn.innerHTML = playing
      ? '<i data-lucide="pause"></i>'
      : '<i data-lucide="play"></i>';
  }

  // Update background cover
  const playerContainer = document.querySelector(
    ".player-container",
  ) as HTMLElement;
  if (playerContainer) {
    playerContainer.style.setProperty("--banner-cover-url", `url("${cover}")`);
  }

  refreshIcons();
}

function updateProgress(current: number, duration: number): void {
  const percentage = duration > 0 ? (current / duration) * 100 : 0;

  if (elements.bannerProgressFill) {
    elements.bannerProgressFill.style.width = `${percentage}%`;
  }

  if (elements.bannerProgressHandle) {
    elements.bannerProgressHandle.style.left = `${percentage}%`;
  }

  if (elements.footerProgressFill) {
    elements.footerProgressFill.style.width = `${percentage}%`;
  }

  if (elements.currentTimeEl) {
    elements.currentTimeEl.textContent = formatTime(current);
  }

  if (elements.durationEl) {
    elements.durationEl.textContent = formatTime(duration);
  }
}

// ===== Player Functions =====

async function ensureUrlFor(
  index: number,
  quality?: QualitySetting,
): Promise<string | null> {
  const item = state.queue[index];
  if (!item) return null;
  if (item.url) return item.url;

  try {
    const fullDetails = await getSongDetails(item.id);
    if (!fullDetails) return null;

    const actualQuality = quality || item.quality || state.qualitySetting;
    item.url = extractPlayableUrl(fullDetails, actualQuality);
    item.title = getTitle(fullDetails) || item.title;
    item.artist = getArtist(fullDetails) || item.artist;
    item.cover = getCover(fullDetails) || item.cover;

    return item.url;
  } catch (error) {
    console.error("Failed to get song details:", error);
    return null;
  }
}

async function playIndex(index: number): Promise<void> {
  if (index < 0 || index >= state.queue.length) return;

  const item = state.queue[index];
  const quality = item.quality || state.qualitySetting;

  updateUI(item, false);
  clearLyricsDisplay();

  const url = await ensureUrlFor(index, quality);
  if (!url) {
    alert("No playable URL found for this track.");
    return;
  }

  elements.audio.src = url;

  try {
    await elements.audio.play();
    state.isPlaying = true;
  } catch (error) {
    console.error("Play failed:", error);
    state.isPlaying = false;
  }

  state.currentIndex = index;
  updateUI(item, state.isPlaying);
  addToRecentlyPlayed(item);
  saveRecentlyPlayed(state.recentlyPlayed);
  setMediaSession(item);

  // Fetch lyrics
  fetchAndDisplayLyrics(item);
}

async function nextSong(): Promise<void> {
  if (state.queue.length === 0) return;

  let nextIndex: number;

  if (state.shuffleMode) {
    nextIndex = Math.floor(Math.random() * state.queue.length);
    if (state.queue.length > 1 && nextIndex === state.currentIndex) {
      nextIndex = (nextIndex + 1) % state.queue.length;
    }
  } else {
    nextIndex = (state.currentIndex + 1) % state.queue.length;
  }

  await playIndex(nextIndex);
}

async function prevSong(): Promise<void> {
  if (state.queue.length === 0) return;

  let prevIndex: number;

  if (state.shuffleMode) {
    prevIndex = Math.floor(Math.random() * state.queue.length);
    if (state.queue.length > 1 && prevIndex === state.currentIndex) {
      prevIndex = (prevIndex + 1) % state.queue.length;
    }
  } else {
    prevIndex =
      (state.currentIndex - 1 + state.queue.length) % state.queue.length;
  }

  await playIndex(prevIndex);
}

async function togglePlay(): Promise<void> {
  if (!elements.audio.src) {
    await searchAndQueue("90s hindi", true);
    return;
  }

  if (elements.audio.paused) {
    try {
      await elements.audio.play();
      state.isPlaying = true;
    } catch (error) {
      console.error("Play failed:", error);
    }
  } else {
    elements.audio.pause();
    state.isPlaying = false;
  }

  const currentItem = state.queue[state.currentIndex];
  updateUI(currentItem, state.isPlaying);
}

// ===== Search and Queue Functions =====

async function searchAndQueue(query: string, autoplay = true): Promise<void> {
  if (!query) return;

  try {
    const results = await searchSongs(query);

    state.queue = results.map((song) =>
      songToQueueItem(song, state.qualitySetting),
    );
    state.currentIndex = state.queue.length > 0 ? 0 : -1;

    if (autoplay && state.currentIndex >= 0) {
      await playIndex(state.currentIndex);
    }
  } catch (error) {
    console.error("Search failed:", error);
    alert("Search failed. Try another query.");
  }
}

// ===== Lyrics Functions =====

function clearLyricsDisplay(): void {
  state.parsedLyrics = [];
  if (elements.lyricsContainer) elements.lyricsContainer.innerHTML = "";
  if (elements.lyricsText) elements.lyricsText.textContent = "";
}

function renderSyncedLyrics(lrcText: string): void {
  clearLyricsDisplay();

  if (!lrcText) {
    if (elements.lyricsContainer) {
      elements.lyricsContainer.innerHTML =
        '<p style="font-size:0.9rem; opacity:0.6;">No lyrics available</p>';
    }
    return;
  }

  state.parsedLyrics = parseLrcLyrics(lrcText);

  if (state.parsedLyrics.length === 0) {
    if (elements.lyricsText) {
      elements.lyricsText.textContent = lrcText;
    } else if (elements.lyricsContainer) {
      elements.lyricsContainer.innerHTML = `<p>${escapeHtml(lrcText)}</p>`;
    }
    return;
  }

  if (elements.lyricsContainer) {
    elements.lyricsContainer.innerHTML = "";

    state.parsedLyrics.forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line.text || "...";
      p.dataset.time = line.time.toString();
      p.classList.add("lyrics-line");
      elements.lyricsContainer!.appendChild(p);
    });
  }
}

async function fetchAndDisplayLyrics(item: QueueItem): Promise<void> {
  try {
    const lyricsData = await getLyrics(item.title, item.artist);

    if (!lyricsData) {
      if (elements.lyricsContainer) {
        elements.lyricsContainer.innerHTML =
          '<p style="font-size:0.9rem; opacity:0.6;">No lyrics available</p>';
      }
      return;
    }

    const bestLyrics = getBestLyrics(lyricsData);

    if (bestLyrics.type === "synced") {
      renderSyncedLyrics(bestLyrics.content);
    } else if (bestLyrics.type === "plain") {
      if (elements.lyricsText) {
        elements.lyricsText.textContent = bestLyrics.content;
      } else if (elements.lyricsContainer) {
        elements.lyricsContainer.innerHTML = `<p>${escapeHtml(bestLyrics.content)}</p>`;
      }
    } else {
      if (elements.lyricsContainer) {
        elements.lyricsContainer.innerHTML =
          '<p style="font-size:0.9rem; opacity:0.6;">No lyrics available</p>';
      }
    }
  } catch (error) {
    console.error("Failed to fetch lyrics:", error);
  }
}

function syncLyrics(currentTime: number): void {
  if (
    !state.parsedLyrics ||
    state.parsedLyrics.length === 0 ||
    !elements.lyricsContainer
  ) {
    return;
  }

  const activeIndex = findActiveLine(state.parsedLyrics, currentTime);

  if (activeIndex >= 0) {
    const isLastLine = activeIndex === state.parsedLyrics.length - 1;
    const children = Array.from(elements.lyricsContainer.children);

    children.forEach((element, index) => {
      const p = element as HTMLElement;
      p.classList.toggle("active-line", index === activeIndex && !isLastLine);

      if (index === activeIndex && !isLastLine) {
        try {
          p.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (error) {
          // Ignore scroll errors
        }
      }
    });
  }
}

// ===== Media Session =====

function setMediaSession(item: QueueItem): void {
  if (!("mediaSession" in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.title,
      artist: item.artist,
      artwork: [
        {
          src: item.cover || FALLBACK_COVER,
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () =>
      elements.audio.play(),
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      elements.audio.pause(),
    );
    navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextSong());
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) {
        elements.audio.currentTime = details.seekTime;
      }
    });
  } catch (error) {
    console.warn("Media session setup failed:", error);
  }
}

// ===== Recently Played =====

function renderRecently(): void {
  const recentlyWrap = document.getElementById("recently");
  if (!recentlyWrap) return;

  recentlyWrap.innerHTML = "";

  state.recentlyPlayed.forEach((item) => {
    const card = document.createElement("div");
    card.className = "music-card";
    card.innerHTML = `
      <img src="${escapeHtml(item.cover || FALLBACK_COVER)}" alt="${escapeHtml(item.title)}">
      <span>${escapeHtml(item.title)}</span>
    `;

    card.addEventListener("click", async () => {
      state.queue = [item];
      state.currentIndex = 0;
      await playIndex(0);
    });

    recentlyWrap.appendChild(card);
  });
}

// ===== Album Functions =====

async function loadAlbums(): Promise<void> {
  try {
    const albumQueries = [
      "Arijit Singh",
      "Pritam",
      "Shreya Ghoshal",
      "kishor kumar",
      "A.R. Rahman",
    ];

    const allAlbums = await loadAlbumsFromQueries(albumQueries);
    renderAlbums(allAlbums);
  } catch (error) {
    console.error("Failed to load albums:", error);
  }
}

function renderAlbums(albums: Album[]): void {
  const albumsWrap = document.getElementById("albums");
  if (!albumsWrap) return;

  albumsWrap.innerHTML = "";

  albums.forEach((album) => {
    const card = document.createElement("div");
    card.className = "music-card";
    card.innerHTML = `
      <img src="${getCover(album)}" alt="${getTitle(album)}">
      <span>${getTitle(album)}</span>
    `;

    card.addEventListener("click", () => {
      playAlbum(album.id);
    });

    albumsWrap.appendChild(card);
  });
}

async function playAlbum(albumId: string): Promise<void> {
  try {
    const album = await getAlbumDetails(albumId);

    if (!album || !album.songs || album.songs.length === 0) {
      alert("No songs found in this album.");
      return;
    }

    const albumCoverEl = document.getElementById(
      "album-cover",
    ) as HTMLImageElement;
    const albumTitleEl = document.getElementById("album-title");
    const albumArtistEl = document.getElementById("album-artist");
    const albumPlayBtn = document.getElementById("album-play");
    const albumViewEl = document.getElementById("album-view");
    const tracksWrap = document.getElementById("album-tracks");

    if (albumCoverEl) albumCoverEl.src = getCover(album);
    if (albumTitleEl) albumTitleEl.textContent = getTitle(album);
    if (albumArtistEl) albumArtistEl.textContent = getArtist(album);

    if (tracksWrap) {
      tracksWrap.innerHTML = "";

      album.songs.forEach((song, index) => {
        const div = document.createElement("div");
        div.className = "album-track";
        div.innerHTML = `<span>${getTitle(song)}</span><small>${getArtist(song)}</small>`;

        div.addEventListener("click", async () => {
          state.queue = album.songs!.map((s) =>
            songToQueueItem(s, state.qualitySetting),
          );
          state.currentIndex = index;
          await playIndex(index);
        });

        tracksWrap.appendChild(div);
      });
    }

    if (albumPlayBtn) {
      albumPlayBtn.onclick = async () => {
        state.queue = album.songs!.map((s) =>
          songToQueueItem(s, state.qualitySetting),
        );
        state.currentIndex = 0;
        await playIndex(0);
      };
    }

    if (albumViewEl) albumViewEl.style.display = "block";

    history.pushState(
      { albumView: true },
      getTitle(album),
      "#" + encodeURIComponent(getTitle(album).replace(/\s+/g, "")),
    );
  } catch (error) {
    console.error("Failed to fetch album songs:", error);
    alert("Failed to load album songs.");
  }
}

async function loadMultipleNewReleaseAlbums(): Promise<void> {
  const albumIds = ["56535946", "1055473"];
  const wrap = document.getElementById("new-releases");

  if (!wrap) {
    console.error("new-releases container not found");
    return;
  }

  wrap.innerHTML = "";

  const albums = await getMultipleAlbumDetails(albumIds);

  albums.forEach((album) => {
    const card = document.createElement("div");
    card.className = "music-card";
    const cover = getCover(album);
    const title = getTitle(album);

    card.innerHTML = `
      <img src="${cover}" alt="${escapeHtml(title)}">
      <span>${escapeHtml(title)}</span>
    `;

    card.addEventListener("click", () => playAlbum(album.id));
    wrap.appendChild(card);
  });
}

// ===== Search Functions =====

async function handleSearch(): Promise<void> {
  const searchInput = document.getElementById(
    "search-input",
  ) as HTMLInputElement;
  const searchResultsWrap = document.getElementById("search-results");

  const query = searchInput?.value?.trim() || "";
  if (!query) return;

  try {
    const results = await searchSongs(query);

    if (searchResultsWrap) searchResultsWrap.innerHTML = "";

    if (!results || results.length === 0) {
      if (searchResultsWrap) {
        searchResultsWrap.innerHTML =
          '<p style="color:var(--foreground-muted)">No results found.</p>';
      }
      return;
    }

    results.forEach((song, index) => {
      const item = songToQueueItem(song, state.qualitySetting);

      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
        <img src="${item.cover}" alt="${item.title}">
        <div class="search-result-info">
          <h4>${item.title}</h4>
          <p>${item.artist}</p>
        </div>
      `;

      div.addEventListener("click", async () => {
        state.queue = results.map((s) =>
          songToQueueItem(s, state.qualitySetting),
        );
        state.currentIndex = index;
        await playIndex(state.currentIndex);
      });

      if (searchResultsWrap) searchResultsWrap.appendChild(div);
    });
  } catch (error) {
    console.error("Search failed:", error);
    if (searchResultsWrap) {
      searchResultsWrap.innerHTML =
        '<p style="color:red">Error fetching results</p>';
    }
  }
}

// ===== Event Listeners Setup =====

function setupAudioEventListeners(): void {
  elements.audio.addEventListener("timeupdate", () => {
    const current = elements.audio.currentTime || 0;
    const duration = elements.audio.duration || 0;

    updateProgress(current, duration);
    syncLyrics(current);
  });

  elements.audio.addEventListener("play", () => {
    state.isPlaying = true;
    updateUI(state.queue[state.currentIndex], true);
  });

  elements.audio.addEventListener("pause", () => {
    state.isPlaying = false;
    updateUI(state.queue[state.currentIndex], false);
  });

  elements.audio.addEventListener("ended", async () => {
    if (state.repeatMode) {
      await playIndex(state.currentIndex);
    } else {
      if (state.currentIndex >= state.queue.length - 1) {
        const currentSong = state.queue[state.currentIndex];

        if (currentSong?.id) {
          const suggestions = await getSongSuggestions(currentSong.id);

          if (suggestions.length > 0) {
            state.queue = suggestions.map((s) =>
              songToQueueItem(s, state.qualitySetting),
            );
            state.currentIndex = 0;
            await playIndex(0);
            return;
          }
        }
      }

      await nextSong();
    }
  });
}

function setupPlayerControls(): void {
  if (elements.footerPlayBtn) {
    elements.footerPlayBtn.addEventListener("click", togglePlay);
  }

  if (elements.footerNextBtn) {
    elements.footerNextBtn.addEventListener("click", nextSong);
  }

  if (elements.bannerPlayPauseBtn) {
    elements.bannerPlayPauseBtn.addEventListener("click", togglePlay);
  }

  if (elements.bannerPrev) {
    elements.bannerPrev.addEventListener("click", prevSong);
  }

  if (elements.bannerNext) {
    elements.bannerNext.addEventListener("click", nextSong);
  }
}

function setupSeekControls(): void {
  if (!elements.bannerProgressTrack) return;

  const handleSeek = (e: Event): void => {
    if (!isFinite(elements.audio.duration)) return;

    e.preventDefault();

    const mouseEvent = e as MouseEvent;
    const touchEvent = e as TouchEvent;
    const trackRect = elements.bannerProgressTrack!.getBoundingClientRect();
    const clientX = touchEvent.touches
      ? touchEvent.touches[0].clientX
      : mouseEvent.clientX;

    let percent = (clientX - trackRect.left) / trackRect.width;
    percent = Math.max(0, Math.min(1, percent));

    const newTime = percent * elements.audio.duration;
    elements.audio.currentTime = newTime;

    const pct = percent * 100;
    if (elements.bannerProgressFill)
      elements.bannerProgressFill.style.width = `${pct}%`;
    if (elements.bannerProgressHandle)
      elements.bannerProgressHandle.style.left = `${pct}%`;
  };

  const startSeeking = (e: Event): void => {
    state.isSeeking = true;
    handleSeek(e);

    document.addEventListener("mousemove", handleSeek);
    document.addEventListener("touchmove", handleSeek);
    document.addEventListener("mouseup", stopSeeking);
    document.addEventListener("touchend", stopSeeking);
  };

  const stopSeeking = (): void => {
    state.isSeeking = false;
    document.removeEventListener("mousemove", handleSeek);
    document.removeEventListener("touchmove", handleSeek);
    document.removeEventListener("mouseup", stopSeeking);
    document.removeEventListener("touchend", stopSeeking);
  };

  elements.bannerProgressTrack.addEventListener("mousedown", startSeeking);
  elements.bannerProgressTrack.addEventListener("touchstart", startSeeking);
}

function setupModeToggles(): void {
  if (elements.shuffleBtn) {
    elements.shuffleBtn.addEventListener("click", () => {
      state.shuffleMode = !state.shuffleMode;

      if (elements.shuffleStatus) {
        elements.shuffleStatus.textContent = state.shuffleMode ? "On" : "Off";
      }

      if (elements.shufflePopup) {
        elements.shufflePopup.classList.add("active");
        setTimeout(
          () => elements.shufflePopup!.classList.remove("active"),
          2000,
        );
      }
    });
  }

  if (elements.repeatBtn) {
    elements.repeatBtn.addEventListener("click", () => {
      state.repeatMode = !state.repeatMode;

      if (elements.repeatStatus) {
        elements.repeatStatus.textContent = state.repeatMode ? "On" : "Off";
      }

      if (elements.repeatPopup) {
        elements.repeatPopup.classList.add("active");
        setTimeout(
          () => elements.repeatPopup!.classList.remove("active"),
          2000,
        );
      }
    });
  }
}

function setupBannerControls(): void {
  const footerOpenBanner = document.getElementById("footer-open-banner");

  if (footerOpenBanner) {
    footerOpenBanner.addEventListener("click", () => {
      if (isMobileDevice() && elements.musicBanner) {
        elements.musicBanner.style.display = "flex";
        elements.musicBanner.classList.add("active");
        history.pushState({ bannerView: true }, "Now Playing", "#now-playing");
      }
    });
  }

  const closeBannerBtn = document.getElementById("close-banner-btn");

  if (closeBannerBtn) {
    const closeBanner = (): void => {
      if (elements.musicBanner) {
        elements.musicBanner.style.display = "none";
        elements.musicBanner.classList.remove("active");

        if (
          window.history.state &&
          (window.history.state as HistoryState).bannerView
        ) {
          history.back();
        }
      }
    };

    closeBannerBtn.addEventListener("click", closeBanner);
    closeBannerBtn.addEventListener("touchstart", closeBanner);
  }
}

function setupLyricsFlip(): void {
  const showLyricsBtn = document.getElementById("show-lyrics-btn");
  const showCoverBtn = document.getElementById("show-cover-btn");

  if (showLyricsBtn && elements.flipInner) {
    showLyricsBtn.addEventListener("click", () => {
      elements.flipInner!.classList.add("flipped");
    });
  }

  if (showCoverBtn && elements.flipInner) {
    showCoverBtn.addEventListener("click", () => {
      elements.flipInner!.classList.remove("flipped");
    });
  }
}

function setupTabNavigation(): void {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".nav-item")
        .forEach((b) => b.classList.remove("active"));
      (e.currentTarget as HTMLElement).classList.add("active");

      document.querySelectorAll(".tab-view").forEach((tab) => {
        (tab as HTMLElement).style.display = "none";
      });

      const tab = (e.currentTarget as HTMLElement).getAttribute("data-tab");
      const tabId = "tab-" + tab;
      const tabEl = document.getElementById(tabId);

      if (tabEl) tabEl.style.display = "block";

      if (window.history && window.history.pushState) {
        window.history.pushState({ tab }, "", "#" + tab);
      }
    });
  });

  // Setup popstate handler for browser navigation
  window.addEventListener("popstate", (ev) => {
    const historyState = ev.state as HistoryState;
    const stateTab =
      historyState?.tab || location.hash.replace("#", "") || "home";

    document.querySelectorAll(".nav-item").forEach((b) => {
      const itemTab = (b as HTMLElement).getAttribute("data-tab");
      b.classList.toggle("active", itemTab === stateTab);
    });

    document.querySelectorAll(".tab-view").forEach((t) => {
      (t as HTMLElement).style.display = "none";
    });

    const id = "tab-" + stateTab;
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });
}

function setupSearchControls(): void {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById(
    "search-input",
  ) as HTMLInputElement;

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }
}

function setupAlbumControls(): void {
  const albumBackBtn = document.getElementById("album-back");

  if (albumBackBtn) {
    albumBackBtn.addEventListener("click", () => {
      const albumView = document.getElementById("album-view");
      if (albumView) albumView.style.display = "none";

      if (
        window.history.state &&
        (window.history.state as HistoryState).albumView
      ) {
        history.back();
      }
    });
  }
}

function setupSettingsControls(): void {
  const settingsSheet = document.getElementById("settings-sheet");
  const closeSettings = document.getElementById("close-settings");
  const settingsButton = document.querySelector(
    ".header-icons button:last-child",
  );

  function refreshQualityButtons(): void {
    document.querySelectorAll(".quality-btn").forEach((btn) => {
      const quality = (btn as HTMLElement).dataset.quality as QualitySetting;
      btn.classList.toggle("active", quality === state.qualitySetting);
    });
  }

  document.querySelectorAll(".quality-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const quality = (btn as HTMLElement).dataset.quality as QualitySetting;
      state.qualitySetting = quality;
      saveQualitySetting(quality);
      refreshQualityButtons();
    });
  });

  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      if (settingsSheet) {
        settingsSheet.classList.add("active");
        refreshQualityButtons();
        history.pushState({ settingsView: true }, "Settings", "#settings");
      }
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener("click", () => {
      if (settingsSheet) settingsSheet.classList.remove("active");

      if (
        window.history.state &&
        (window.history.state as HistoryState).settingsView
      ) {
        history.back();
      }
    });
  }

  // Handle popstate for settings
  window.addEventListener("popstate", () => {
    const historyState = window.history.state as HistoryState;

    if (historyState?.settingsView && settingsSheet) {
      settingsSheet.classList.add("active");
    } else if (settingsSheet) {
      settingsSheet.classList.remove("active");
    }

    if (historyState?.bannerView && isMobileDevice() && elements.musicBanner) {
      elements.musicBanner.style.display = "flex";
      elements.musicBanner.classList.add("active");
    } else if (elements.musicBanner) {
      elements.musicBanner.style.display = "none";
      elements.musicBanner.classList.remove("active");
    }

    if (!historyState?.albumView) {
      const albumView = document.getElementById("album-view");
      if (albumView) albumView.style.display = "none";
    }
  });
}

// ===== Initialization =====

function setGreeting(): void {
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) {
    greetingEl.textContent = getGreeting();
  }
}

function loadStoredData(): void {
  state.recentlyPlayed = loadRecentlyPlayed();
  state.qualitySetting = loadQualitySetting();
  renderRecently();
}

async function initializeApp(): Promise<void> {
  console.log("Initializing Music45 App...");

  // Set greeting
  setGreeting();

  // Initialize DOM elements
  initializeElements();

  // Load stored data
  loadStoredData();

  // Setup all event listeners
  setupAudioEventListeners();
  setupPlayerControls();
  setupSeekControls();
  setupModeToggles();
  setupBannerControls();
  setupLyricsFlip();
  setupTabNavigation();
  setupSearchControls();
  setupAlbumControls();
  setupSettingsControls();

  // Load initial content
  await loadAlbums();
  await loadMultipleNewReleaseAlbums();

  // Initialize icons
  refreshIcons();

  console.log("Music45 App initialized successfully!");
}

// ===== Entry Point =====

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");
  initializeApp().catch((error) => {
    console.error("Failed to initialize app:", error);
  });
});

// ===== Export for external use =====

export {
  state,
  elements,
  playIndex,
  nextSong,
  prevSong,
  togglePlay,
  searchAndQueue,
  loadAlbums,
  playAlbum,
};
