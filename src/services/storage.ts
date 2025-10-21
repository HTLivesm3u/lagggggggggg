// ===== Music45 Storage Service =====

import type {
  QueueItem,
  QualitySetting,
  StorageData,
} from '../types';
import { safeJsonParse } from '../utils/helpers';

// ===== Storage Keys =====

const STORAGE_KEYS = {
  RECENT_SONGS: 'recentSongs',
  QUALITY_SETTING: 'qualitySetting',
  PLAYER_STATE: 'playerState',
  LAST_PLAYED: 'lastPlayed',
  FAVORITES: 'favorites',
} as const;

// ===== Constants =====

const MAX_RECENTLY_PLAYED = 12;
const DEFAULT_QUALITY: QualitySetting = 'auto';

// ===== Helper Functions =====

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely get item from localStorage
 */
function getStorageItem(key: string): string | null {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get item from storage: ${key}`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage
 */
function setStorageItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set item in storage: ${key}`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
function removeStorageItem(key: string): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from storage: ${key}`, error);
    return false;
  }
}

// ===== Recently Played Operations =====

/**
 * Load recently played songs from storage
 */
export function loadRecentlyPlayed(): QueueItem[] {
  const data = getStorageItem(STORAGE_KEYS.RECENT_SONGS);

  if (!data) {
    return [];
  }

  const parsed = safeJsonParse<QueueItem[]>(data, []);

  // Validate and filter items
  return parsed.filter((item) => {
    return (
      item &&
      typeof item === 'object' &&
      item.id &&
      item.title &&
      item.artist &&
      item.cover
    );
  });
}

/**
 * Save recently played songs to storage
 */
export function saveRecentlyPlayed(songs: QueueItem[]): boolean {
  if (!Array.isArray(songs)) {
    console.error('Invalid songs array');
    return false;
  }

  // Limit to MAX_RECENTLY_PLAYED items
  const limitedSongs = songs.slice(0, MAX_RECENTLY_PLAYED);

  try {
    const json = JSON.stringify(limitedSongs);
    return setStorageItem(STORAGE_KEYS.RECENT_SONGS, json);
  } catch (error) {
    console.error('Failed to save recently played songs', error);
    return false;
  }
}

/**
 * Add a song to recently played
 */
export function addToRecentlyPlayed(song: QueueItem): boolean {
  try {
    const recentSongs = loadRecentlyPlayed();
    const key = song._k || `id:${song.id}`;

    // Remove existing entry if present
    const filtered = recentSongs.filter((item) => item._k !== key);

    // Add to beginning
    const updated = [{ ...song, _k: key }, ...filtered].slice(0, MAX_RECENTLY_PLAYED);

    return saveRecentlyPlayed(updated);
  } catch (error) {
    console.error('Failed to add to recently played', error);
    return false;
  }
}

/**
 * Clear recently played songs
 */
export function clearRecentlyPlayed(): boolean {
  return removeStorageItem(STORAGE_KEYS.RECENT_SONGS);
}

// ===== Quality Settings Operations =====

/**
 * Load quality setting from storage
 */
export function loadQualitySetting(): QualitySetting {
  const data = getStorageItem(STORAGE_KEYS.QUALITY_SETTING);

  if (!data) {
    return DEFAULT_QUALITY;
  }

  const validQualities: QualitySetting[] = ['Less_low', 'low', 'medium', 'high', 'auto'];

  if (validQualities.includes(data as QualitySetting)) {
    return data as QualitySetting;
  }

  return DEFAULT_QUALITY;
}

/**
 * Save quality setting to storage
 */
export function saveQualitySetting(quality: QualitySetting): boolean {
  const validQualities: QualitySetting[] = ['Less_low', 'low', 'medium', 'high', 'auto'];

  if (!validQualities.includes(quality)) {
    console.error('Invalid quality setting:', quality);
    return false;
  }

  return setStorageItem(STORAGE_KEYS.QUALITY_SETTING, quality);
}

// ===== Last Played Track =====

/**
 * Save the last played track info
 */
export function saveLastPlayed(song: QueueItem, currentTime: number): boolean {
  try {
    const data = {
      song,
      currentTime,
      timestamp: Date.now(),
    };

    const json = JSON.stringify(data);
    return setStorageItem(STORAGE_KEYS.LAST_PLAYED, json);
  } catch (error) {
    console.error('Failed to save last played track', error);
    return false;
  }
}

/**
 * Load the last played track info
 */
export function loadLastPlayed(): { song: QueueItem; currentTime: number } | null {
  const data = getStorageItem(STORAGE_KEYS.LAST_PLAYED);

  if (!data) {
    return null;
  }

  const parsed = safeJsonParse<{
    song: QueueItem;
    currentTime: number;
    timestamp: number;
  } | null>(data, null);

  if (!parsed || !parsed.song) {
    return null;
  }

  // Only return if saved within last 24 hours
  const dayInMs = 24 * 60 * 60 * 1000;
  if (Date.now() - parsed.timestamp > dayInMs) {
    removeStorageItem(STORAGE_KEYS.LAST_PLAYED);
    return null;
  }

  return {
    song: parsed.song,
    currentTime: parsed.currentTime || 0,
  };
}

/**
 * Clear last played track info
 */
export function clearLastPlayed(): boolean {
  return removeStorageItem(STORAGE_KEYS.LAST_PLAYED);
}

// ===== Favorites Operations =====

/**
 * Load favorite songs
 */
export function loadFavorites(): QueueItem[] {
  const data = getStorageItem(STORAGE_KEYS.FAVORITES);

  if (!data) {
    return [];
  }

  const parsed = safeJsonParse<QueueItem[]>(data, []);

  return parsed.filter((item) => {
    return (
      item &&
      typeof item === 'object' &&
      item.id &&
      item.title
    );
  });
}

/**
 * Save favorite songs
 */
export function saveFavorites(songs: QueueItem[]): boolean {
  if (!Array.isArray(songs)) {
    console.error('Invalid songs array');
    return false;
  }

  try {
    const json = JSON.stringify(songs);
    return setStorageItem(STORAGE_KEYS.FAVORITES, json);
  } catch (error) {
    console.error('Failed to save favorites', error);
    return false;
  }
}

/**
 * Add song to favorites
 */
export function addToFavorites(song: QueueItem): boolean {
  try {
    const favorites = loadFavorites();

    // Check if already exists
    const exists = favorites.some((item) => item.id === song.id);

    if (exists) {
      return true; // Already in favorites
    }

    const updated = [...favorites, song];
    return saveFavorites(updated);
  } catch (error) {
    console.error('Failed to add to favorites', error);
    return false;
  }
}

/**
 * Remove song from favorites
 */
export function removeFromFavorites(songId: string): boolean {
  try {
    const favorites = loadFavorites();
    const updated = favorites.filter((item) => item.id !== songId);

    return saveFavorites(updated);
  } catch (error) {
    console.error('Failed to remove from favorites', error);
    return false;
  }
}

/**
 * Check if song is in favorites
 */
export function isFavorite(songId: string): boolean {
  const favorites = loadFavorites();
  return favorites.some((item) => item.id === songId);
}

/**
 * Clear all favorites
 */
export function clearFavorites(): boolean {
  return removeStorageItem(STORAGE_KEYS.FAVORITES);
}

// ===== Bulk Operations =====

/**
 * Load all storage data
 */
export function loadAllData(): StorageData {
  return {
    recentSongs: loadRecentlyPlayed(),
    qualitySetting: loadQualitySetting(),
  };
}

/**
 * Clear all storage data
 */
export function clearAllData(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      removeStorageItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear all storage data', error);
    return false;
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
  available: boolean;
  estimatedSize: number;
  keys: string[];
} {
  const available = isStorageAvailable();

  if (!available) {
    return {
      available: false,
      estimatedSize: 0,
      keys: [],
    };
  }

  try {
    const keys = Object.values(STORAGE_KEYS);
    let totalSize = 0;

    keys.forEach((key) => {
      const value = getStorageItem(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return {
      available: true,
      estimatedSize: totalSize,
      keys,
    };
  } catch (error) {
    console.error('Failed to get storage info', error);
    return {
      available: true,
      estimatedSize: 0,
      keys: [],
    };
  }
}

// ===== Export all storage functions =====

export default {
  loadRecentlyPlayed,
  saveRecentlyPlayed,
  addToRecentlyPlayed,
  clearRecentlyPlayed,
  loadQualitySetting,
  saveQualitySetting,
  saveLastPlayed,
  loadLastPlayed,
  clearLastPlayed,
  loadFavorites,
  saveFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  clearFavorites,
  loadAllData,
  clearAllData,
  getStorageInfo,
};
