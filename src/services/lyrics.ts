// ===== Music45 Lyrics Service =====

import type {
  LyricsLine,
  LyricsData,
  LyricsApiResponse,
} from '../types';
import { fetchLyrics as apiFetchLyrics, searchLyrics } from './api';

// ===== Constants =====

const LRC_TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]/g;
const METADATA_REGEX = /\[(ti|ar|al|by|offset):[^\]]*\]/g;

// ===== Lyrics Parsing =====

/**
 * Parse LRC format lyrics into timed lines
 */
export function parseLrcLyrics(lrcText: string): LyricsLine[] {
  if (!lrcText || typeof lrcText !== 'string') {
    return [];
  }

  const lines = lrcText.split('\n');
  const parsedLines: LyricsLine[] = [];

  lines.forEach((line) => {
    // Remove metadata tags
    const cleanLine = line.replace(METADATA_REGEX, '').trim();

    if (!cleanLine) {
      return;
    }

    // Find all timestamps in the line
    const timestamps: RegExpMatchArray[] = Array.from(
      line.matchAll(LRC_TIMESTAMP_REGEX)
    );

    if (timestamps.length === 0) {
      return;
    }

    // Extract text (everything after timestamps)
    const text = line.replace(LRC_TIMESTAMP_REGEX, '').trim();

    // Create a line entry for each timestamp
    timestamps.forEach((match) => {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;

      parsedLines.push({
        time,
        text: text || '',
      });
    });
  });

  // Sort by time
  return parsedLines.sort((a, b) => a.time - b.time);
}

/**
 * Parse plain text lyrics
 */
export function parsePlainLyrics(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Detect if lyrics text is in LRC format
 */
export function isLrcFormat(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return LRC_TIMESTAMP_REGEX.test(text);
}

// ===== Lyrics Fetching =====

/**
 * Fetch and parse lyrics for a track
 */
export async function getLyrics(
  trackName: string,
  artistName?: string,
  albumName?: string,
  duration?: number
): Promise<LyricsData | null> {
  try {
    const response = await apiFetchLyrics(
      trackName,
      artistName,
      albumName,
      duration
    );

    if (!response) {
      console.log('No lyrics found');
      return null;
    }

    return {
      syncedLyrics: response.syncedLyrics,
      plainLyrics: response.plainLyrics,
      lrc: response.lrc,
      lyrics: response.lyrics,
    };
  } catch (error) {
    console.error('Failed to fetch lyrics:', error);
    return null;
  }
}

/**
 * Search for lyrics and return the best match
 */
export async function searchAndGetLyrics(
  trackName: string,
  artistName?: string
): Promise<LyricsData | null> {
  try {
    const results = await searchLyrics(trackName, artistName);

    if (!results || results.length === 0) {
      return null;
    }

    // Return the first match
    const first = results[0];

    return {
      syncedLyrics: first.syncedLyrics,
      plainLyrics: first.plainLyrics,
      lrc: first.lrc,
      lyrics: first.lyrics,
    };
  } catch (error) {
    console.error('Failed to search lyrics:', error);
    return null;
  }
}

/**
 * Get the best available lyrics from response
 */
export function getBestLyrics(data: LyricsData | null): {
  type: 'synced' | 'plain' | 'none';
  content: string;
} {
  if (!data) {
    return { type: 'none', content: '' };
  }

  // Priority: syncedLyrics > lrc > lyrics > plainLyrics
  if (data.syncedLyrics) {
    return { type: 'synced', content: data.syncedLyrics };
  }

  if (data.lrc) {
    return { type: 'synced', content: data.lrc };
  }

  if (data.lyrics && isLrcFormat(data.lyrics)) {
    return { type: 'synced', content: data.lyrics };
  }

  if (data.plainLyrics) {
    return { type: 'plain', content: data.plainLyrics };
  }

  if (data.lyrics) {
    return { type: 'plain', content: data.lyrics };
  }

  return { type: 'none', content: '' };
}

// ===== Lyrics Synchronization =====

/**
 * Find the current active line based on current time
 */
export function findActiveLine(
  lyrics: LyricsLine[],
  currentTime: number
): number {
  if (!lyrics || lyrics.length === 0) {
    return -1;
  }

  // Find the last line that has started
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }

  return -1;
}

/**
 * Get the next line that will be active
 */
export function getNextLine(
  lyrics: LyricsLine[],
  currentIndex: number
): LyricsLine | null {
  if (!lyrics || currentIndex < 0 || currentIndex >= lyrics.length - 1) {
    return null;
  }

  return lyrics[currentIndex + 1];
}

/**
 * Get time until next line
 */
export function getTimeUntilNextLine(
  lyrics: LyricsLine[],
  currentTime: number,
  currentIndex: number
): number {
  const nextLine = getNextLine(lyrics, currentIndex);

  if (!nextLine) {
    return -1;
  }

  return Math.max(0, nextLine.time - currentTime);
}

/**
 * Get a window of lines around the current line
 */
export function getLyricsWindow(
  lyrics: LyricsLine[],
  currentIndex: number,
  windowSize: number = 3
): LyricsLine[] {
  if (!lyrics || lyrics.length === 0 || currentIndex < 0) {
    return [];
  }

  const start = Math.max(0, currentIndex - windowSize);
  const end = Math.min(lyrics.length, currentIndex + windowSize + 1);

  return lyrics.slice(start, end);
}

// ===== Lyrics Formatting =====

/**
 * Format time for display in lyrics
 */
export function formatLyricsTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Convert parsed lyrics back to LRC format
 */
export function toLrcFormat(lyrics: LyricsLine[]): string {
  if (!lyrics || lyrics.length === 0) {
    return '';
  }

  return lyrics
    .map((line) => `[${formatLyricsTime(line.time)}]${line.text}`)
    .join('\n');
}

/**
 * Clean lyrics text (remove extra whitespace, empty lines)
 */
export function cleanLyricsText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

// ===== Lyrics Validation =====

/**
 * Validate if lyrics data is usable
 */
export function isValidLyrics(data: LyricsData | null): boolean {
  if (!data) {
    return false;
  }

  return !!(
    data.syncedLyrics ||
    data.plainLyrics ||
    data.lrc ||
    data.lyrics
  );
}

/**
 * Validate parsed lyrics lines
 */
export function areValidLyricsLines(lines: LyricsLine[]): boolean {
  if (!Array.isArray(lines) || lines.length === 0) {
    return false;
  }

  // Check if all lines have valid time and text
  return lines.every(
    (line) =>
      typeof line.time === 'number' &&
      line.time >= 0 &&
      typeof line.text === 'string'
  );
}

// ===== Lyrics Offset =====

/**
 * Apply time offset to lyrics lines
 */
export function applyOffset(
  lyrics: LyricsLine[],
  offsetMs: number
): LyricsLine[] {
  if (!lyrics || lyrics.length === 0) {
    return [];
  }

  const offsetSeconds = offsetMs / 1000;

  return lyrics.map((line) => ({
    time: Math.max(0, line.time + offsetSeconds),
    text: line.text,
  }));
}

/**
 * Extract offset from LRC metadata
 */
export function extractOffset(lrcText: string): number {
  if (!lrcText || typeof lrcText !== 'string') {
    return 0;
  }

  const match = lrcText.match(/\[offset:(-?\d+)\]/);

  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

// ===== Export all lyrics functions =====

export default {
  parseLrcLyrics,
  parsePlainLyrics,
  isLrcFormat,
  getLyrics,
  searchAndGetLyrics,
  getBestLyrics,
  findActiveLine,
  getNextLine,
  getTimeUntilNextLine,
  getLyricsWindow,
  formatLyricsTime,
  toLrcFormat,
  cleanLyricsText,
  isValidLyrics,
  areValidLyricsLines,
  applyOffset,
  extractOffset,
};
