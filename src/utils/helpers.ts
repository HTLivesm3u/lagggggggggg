// ===== Music45 Utility Functions =====

import type {
  Song,
  Album,
  QueueItem,
  ImageQuality,
  DownloadUrl,
  QualitySetting,
  TimeFormat,
} from '../types';

// ===== Constants =====

export const FALLBACK_COVER = 'LOGO.jpg';
export const MAX_RECENTLY_PLAYED = 12;

// ===== HTML Utilities =====

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return String(str).replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Decodes HTML entities back to their original characters
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
  if (!str) return '';

  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

// ===== Song Data Extractors =====

/**
 * Extracts and returns the song title from various possible fields
 */
export function getTitle(song: Song | Album | QueueItem | null | undefined): string {
  if (!song) return 'Unknown Title';

  const rawTitle =
    ('title' in song && song.title) ||
    ('name' in song && song.name) ||
    ('song' in song && song.song) ||
    'Unknown Title';

  return decodeHtmlEntities(String(rawTitle));
}

/**
 * Extracts and returns the artist name from various possible fields
 */
export function getArtist(song: Song | Album | null | undefined): string {
  if (!song) return 'Unknown Artist';

  let artistName: string | null = null;

  // Try different artist field variations
  if ('primaryArtists' in song && song.primaryArtists) {
    artistName = song.primaryArtists;
  } else if ('primary_artists' in song && song.primary_artists) {
    artistName = song.primary_artists;
  } else if ('artists' in song && song.artists) {
    if (song.artists.primary && song.artists.primary.length > 0) {
      artistName = song.artists.primary.map((a) => a.name).join(', ');
    } else if (song.artists.featured && song.artists.featured.length > 0) {
      artistName = song.artists.featured.map((a) => a.name).join(', ');
    }
  } else if ('singers' in song && song.singers) {
    artistName = song.singers;
  } else if ('artist' in song && song.artist) {
    artistName = song.artist;
  }

  return decodeHtmlEntities(artistName || 'Unknown Artist');
}

/**
 * Extracts the best quality cover image URL
 */
export function getCover(item: Song | Album | QueueItem | null | undefined): string {
  if (!item) return FALLBACK_COVER;

  // Handle QueueItem with direct cover property
  if ('cover' in item && typeof item.cover === 'string' && item.cover) {
    return item.cover;
  }

  // Handle array of image qualities
  if ('image' in item && Array.isArray(item.image) && item.image.length > 0) {
    const images = item.image as ImageQuality[];

    // Try to find high quality image (500x500 or higher)
    const highQuality = images.find(
      (img) =>
        img.quality &&
        /500|b|large|high/i.test(img.quality)
    );

    if (highQuality) {
      return highQuality.link || highQuality.url || FALLBACK_COVER;
    }

    // Fall back to last (usually highest) quality
    const lastImage = images[images.length - 1];
    return lastImage.link || lastImage.url || FALLBACK_COVER;
  }

  // Handle direct image URL
  if ('image_url' in item && item.image_url) {
    return item.image_url;
  }

  if ('image' in item && typeof item.image === 'string' && item.image) {
    return item.image;
  }

  return FALLBACK_COVER;
}

// ===== Time Utilities =====

/**
 * Formats seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parses time format and returns TimeFormat object
 */
export function parseTime(seconds: number): TimeFormat {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return {
    minutes,
    seconds: secs,
    formatted: formatTime(seconds),
  };
}

/**
 * Converts MM:SS string to seconds
 */
export function timeStringToSeconds(timeString: string): number {
  const parts = timeString.split(':').map((part) => parseFloat(part));

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return 0;
}

// ===== URL Utilities =====

/**
 * Extracts playable audio URL based on quality setting
 */
export function extractPlayableUrl(
  songDetails: Song | null | undefined,
  quality: QualitySetting = 'auto'
): string | null {
  if (!songDetails) return null;

  const downloadUrls =
    songDetails.downloadUrl ||
    songDetails.download_url;

  if (Array.isArray(downloadUrls) && downloadUrls.length > 0) {
    return getUrlByQuality(downloadUrls, quality);
  }

  // Fallback to direct media URLs
  return (
    songDetails.media_url ||
    songDetails.url ||
    songDetails.audio ||
    null
  );
}

/**
 * Finds the best URL based on quality preference
 */
function getUrlByQuality(
  downloadUrls: DownloadUrl[],
  quality: QualitySetting
): string | null {
  // Auto quality - return highest
  if (quality === 'auto') {
    const lastUrl = downloadUrls[downloadUrls.length - 1];
    return lastUrl.link || lastUrl.url || null;
  }

  // Quality mapping
  const qualityMap: Record<QualitySetting, string> = {
    Less_low: '48',
    low: '96',
    medium: '160',
    high: '320',
    auto: '',
  };

  const targetBitrate = qualityMap[quality];

  if (targetBitrate) {
    const matchingUrl = downloadUrls.find((url) =>
      url.quality && new RegExp(targetBitrate, 'i').test(url.quality)
    );

    if (matchingUrl) {
      return matchingUrl.link || matchingUrl.url || null;
    }
  }

  // Fallback to highest quality
  const lastUrl = downloadUrls[downloadUrls.length - 1];
  return lastUrl.link || lastUrl.url || null;
}

// ===== Device Detection =====

/**
 * Checks if the current device is mobile
 */
export function isMobileDevice(): boolean {
  const isMobile =
    window.innerWidth <= 768 &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  console.log('isMobileDevice:', isMobile);
  return isMobile;
}

/**
 * Checks if the device supports touch events
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ===== Array Utilities =====

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Removes duplicates from array based on a key
 */
export function removeDuplicates<T>(
  array: T[],
  getKey: (item: T) => string
): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ===== Queue Utilities =====

/**
 * Generates a unique key for a queue item
 */
export function generateQueueItemKey(item: QueueItem | Song): string {
  if ('id' in item && item.id) {
    return `id:${item.id}`;
  }

  const title = getTitle(item);
  return `t:${title}`;
}

/**
 * Converts a Song to a QueueItem
 */
export function songToQueueItem(
  song: Song,
  quality?: QualitySetting
): QueueItem {
  return {
    id: song.id,
    title: getTitle(song),
    artist: getArtist(song),
    cover: getCover(song),
    url: null,
    raw: song,
    quality,
    _k: generateQueueItemKey(song),
  };
}

// ===== Validation Utilities =====

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if audio element can play the given URL
 */
export function canPlayAudio(url: string | null | undefined): boolean {
  if (!isValidUrl(url)) return false;

  const audio = document.createElement('audio');
  const canPlay = audio.canPlayType('audio/mpeg');

  return canPlay !== '';
}

// ===== Progress Utilities =====

/**
 * Calculates progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0 || !isFinite(total)) return 0;

  const percentage = (current / total) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Calculates seek position from click/touch event
 */
export function calculateSeekPosition(
  event: MouseEvent | TouchEvent,
  progressBar: HTMLElement
): number {
  const rect = progressBar.getBoundingClientRect();
  const clientX =
    'touches' in event
      ? event.touches[0].clientX
      : event.clientX;

  const position = (clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(1, position));
}

// ===== Greeting Utilities =====

/**
 * Returns appropriate greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

// ===== Debounce Utility =====

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

// ===== Throttle Utility =====

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ===== Error Handling =====

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Creates a user-friendly error message
 */
export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

// ===== Export all utilities =====

export default {
  escapeHtml,
  decodeHtmlEntities,
  getTitle,
  getArtist,
  getCover,
  formatTime,
  parseTime,
  timeStringToSeconds,
  extractPlayableUrl,
  isMobileDevice,
  isTouchDevice,
  shuffleArray,
  removeDuplicates,
  generateQueueItemKey,
  songToQueueItem,
  isValidUrl,
  canPlayAudio,
  calculateProgress,
  calculateSeekPosition,
  getGreeting,
  debounce,
  throttle,
  safeJsonParse,
  createErrorMessage,
};
