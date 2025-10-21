// ===== Music45 API Service =====

import type {
  Song,
  Album,
  ApiResponse,
  SearchResponse,
  AlbumResponse,
  SongDetailsResponse,
  SuggestionsResponse,
  LyricsApiResponse,
} from "../types";
import { MusicPlayerError } from "../types";

// ===== Configuration =====

const API_BASE_URL = "https://music45-api.vercel.app/api";
const LYRICS_API_URL = "https://lrclib.net/api";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

// ===== Error Handling =====

function createApiError(
  message: string,
  statusCode?: number,
  details?: unknown,
): MusicPlayerError {
  const error = new MusicPlayerError(message, "API_ERROR", details);
  if (statusCode) {
    (error as any).statusCode = statusCode;
  }
  return error;
}

// ===== Generic Fetch Wrapper =====

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      throw createApiError("Request timeout", 408);
    }
    throw error;
  }
}

// ===== Song Search =====

/**
 * Search for songs by query
 */
export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || query.trim().length === 0) {
    throw createApiError("Search query cannot be empty");
  }

  try {
    const url = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createApiError(
        `Search failed with status ${response.status}`,
        response.status,
      );
    }

    const data = await response.json();
    return data?.data?.results || [];
  } catch (error) {
    console.error("Search songs failed:", error);

    if (error instanceof MusicPlayerError) {
      throw error;
    }

    throw createApiError("Failed to search songs", undefined, error);
  }
}

// ===== Song Details =====

/**
 * Get detailed information for a song by ID
 */
export async function getSongDetails(songId: string): Promise<Song | null> {
  if (!songId) {
    throw createApiError("Song ID is required");
  }

  try {
    const url = `${API_BASE_URL}/songs?ids=${encodeURIComponent(songId)}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createApiError(
        `Failed to fetch song details: ${response.status}`,
        response.status,
      );
    }

    const data: SongDetailsResponse = await response.json();

    if (Array.isArray(data.data)) {
      return data.data[0] || null;
    }

    return data.data || null;
  } catch (error) {
    console.error("Get song details failed:", error);

    if (error instanceof MusicPlayerError) {
      throw error;
    }

    throw createApiError("Failed to get song details", undefined, error);
  }
}

/**
 * Get details for multiple songs by their IDs
 */
export async function getMultipleSongDetails(
  songIds: string[],
): Promise<Song[]> {
  if (!songIds || songIds.length === 0) {
    return [];
  }

  try {
    const idsParam = songIds.join(",");
    const url = `${API_BASE_URL}/songs?ids=${encodeURIComponent(idsParam)}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createApiError(
        `Failed to fetch songs: ${response.status}`,
        response.status,
      );
    }

    const data: SongDetailsResponse = await response.json();
    return Array.isArray(data.data) ? data.data : [data.data];
  } catch (error) {
    console.error("Get multiple song details failed:", error);
    throw createApiError("Failed to get song details", undefined, error);
  }
}

// ===== Album Operations =====

/**
 * Search for albums by query
 */
export async function searchAlbums(query: string): Promise<Album[]> {
  if (!query || query.trim().length === 0) {
    throw createApiError("Search query cannot be empty");
  }

  try {
    const url = `${API_BASE_URL}/search/albums?query=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createApiError(
        `Album search failed: ${response.status}`,
        response.status,
      );
    }

    const data = await response.json();
    return data?.data?.results || [];
  } catch (error) {
    console.error("Search albums failed:", error);

    if (error instanceof MusicPlayerError) {
      throw error;
    }

    throw createApiError("Failed to search albums", undefined, error);
  }
}

/**
 * Get album details including its songs
 */
export async function getAlbumDetails(albumId: string): Promise<Album | null> {
  if (!albumId) {
    throw createApiError("Album ID is required");
  }

  try {
    const url = `${API_BASE_URL}/albums?id=${encodeURIComponent(albumId)}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createApiError(
        `Failed to fetch album: ${response.status}`,
        response.status,
      );
    }

    const data: AlbumResponse = await response.json();

    if (Array.isArray(data.data)) {
      return data.data[0] || null;
    }

    return data.data || null;
  } catch (error) {
    console.error("Get album details failed:", error);

    if (error instanceof MusicPlayerError) {
      throw error;
    }

    throw createApiError("Failed to get album details", undefined, error);
  }
}

/**
 * Get details for multiple albums
 */
export async function getMultipleAlbumDetails(
  albumIds: string[],
): Promise<Album[]> {
  if (!albumIds || albumIds.length === 0) {
    return [];
  }

  try {
    const promises = albumIds.map((id) => getAlbumDetails(id));
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<Album | null> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value as Album);
  } catch (error) {
    console.error("Get multiple albums failed:", error);
    throw createApiError("Failed to get albums", undefined, error);
  }
}

// ===== Song Suggestions =====

/**
 * Get song suggestions based on a song ID
 */
export async function getSongSuggestions(songId: string): Promise<Song[]> {
  if (!songId) {
    throw createApiError("Song ID is required");
  }

  try {
    const url = `${API_BASE_URL}/songs/${encodeURIComponent(songId)}/suggestions`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw createApiError(
        `Failed to fetch suggestions: ${response.status}`,
        response.status,
      );
    }

    const data: SuggestionsResponse = await response.json();

    if (data?.data) {
      if ("results" in data.data && Array.isArray(data.data.results)) {
        return data.data.results;
      }
      if (Array.isArray(data.data)) {
        return data.data;
      }
    }

    return [];
  } catch (error) {
    console.error("Get song suggestions failed:", error);

    // Don't throw on suggestions failure, just return empty array
    return [];
  }
}

// ===== Lyrics Operations =====

/**
 * Fetch lyrics from LrcLib API
 */
export async function fetchLyrics(
  trackName: string,
  artistName?: string,
  albumName?: string,
  duration?: number,
): Promise<LyricsApiResponse | null> {
  if (!trackName || trackName.trim().length === 0) {
    throw createApiError("Track name is required for lyrics");
  }

  try {
    const params = new URLSearchParams();
    params.append("track_name", trackName.trim());

    if (artistName && artistName.trim().length > 0) {
      params.append("artist_name", artistName.trim());
    }

    if (albumName && albumName.trim().length > 0) {
      params.append("album_name", albumName.trim());
    }

    if (duration && duration > 0) {
      params.append("duration", Math.floor(duration).toString());
    }

    const url = `${LYRICS_API_URL}/get?${params.toString()}`;
    const response = await fetchWithTimeout(url, {}, 8000);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No lyrics found
      }
      throw createApiError(
        `Lyrics fetch failed: ${response.status}`,
        response.status,
      );
    }

    const data: LyricsApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch lyrics failed:", error);

    // Don't throw on lyrics failure, return null
    return null;
  }
}

/**
 * Search for lyrics by track and artist
 */
export async function searchLyrics(
  trackName: string,
  artistName?: string,
): Promise<LyricsApiResponse[]> {
  if (!trackName || trackName.trim().length === 0) {
    throw createApiError("Track name is required for lyrics search");
  }

  try {
    const params = new URLSearchParams();
    params.append("q", trackName.trim());

    if (artistName && artistName.trim().length > 0) {
      params.append("artist_name", artistName.trim());
    }

    const url = `${LYRICS_API_URL}/search?${params.toString()}`;
    const response = await fetchWithTimeout(url, {}, 8000);

    if (!response.ok) {
      throw createApiError(
        `Lyrics search failed: ${response.status}`,
        response.status,
      );
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Search lyrics failed:", error);
    return [];
  }
}

// ===== Batch Operations =====

/**
 * Load multiple albums from an array of queries
 */
export async function loadAlbumsFromQueries(
  queries: string[],
): Promise<Album[]> {
  if (!queries || queries.length === 0) {
    return [];
  }

  try {
    const allAlbums: Album[] = [];

    for (const query of queries) {
      try {
        const albums = await searchAlbums(query);
        allAlbums.push(...albums.slice(0, 5));
      } catch (error) {
        console.error(`Failed to load albums for query: ${query}`, error);
        // Continue with other queries
      }
    }

    return allAlbums;
  } catch (error) {
    console.error("Load albums from queries failed:", error);
    throw createApiError("Failed to load albums", undefined, error);
  }
}

// ===== Export all API functions =====

export default {
  searchSongs,
  getSongDetails,
  getMultipleSongDetails,
  searchAlbums,
  getAlbumDetails,
  getMultipleAlbumDetails,
  getSongSuggestions,
  fetchLyrics,
  searchLyrics,
  loadAlbumsFromQueries,
};
