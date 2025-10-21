// ===== Core Types =====

export interface Song {
  id: string;
  name?: string;
  song?: string;
  title?: string;
  primaryArtists?: string;
  primary_artists?: string;
  singers?: string;
  artist?: string;
  artists?: {
    primary?: Array<{ name: string; id: string }>;
    featured?: Array<{ name: string; id: string }>;
  };
  image?: ImageQuality[] | string;
  image_url?: string;
  downloadUrl?: DownloadUrl[];
  download_url?: DownloadUrl[];
  media_url?: string;
  url?: string;
  audio?: string;
  duration?: number | string;
  album?: {
    id: string;
    name: string;
  };
  year?: string;
  language?: string;
  hasLyrics?: boolean;
}

export interface ImageQuality {
  quality: string;
  link?: string;
  url?: string;
}

export interface DownloadUrl {
  quality: string;
  link?: string;
  url?: string;
}

export interface QueueItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string | null;
  raw: Song;
  quality?: QualitySetting;
  _k?: string;
}

export interface Album {
  id: string;
  name?: string;
  title?: string;
  image?: ImageQuality[] | string;
  image_url?: string;
  primaryArtists?: string;
  primary_artists?: string;
  artist?: string;
  artists?: {
    primary?: Array<{ name: string; id: string }>;
    featured?: Array<{ name: string; id: string }>;
  };
  songs?: Song[];
  songCount?: number;
  year?: string;
  language?: string;
  type?: string;
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SearchResponse {
  results: Song[];
  total?: number;
  start?: number;
}

export interface AlbumResponse {
  data: Album[] | Album;
}

export interface SongDetailsResponse {
  data: Song[] | Song;
}

export interface SuggestionsResponse {
  data: {
    results?: Song[];
  } | Song[];
}

// ===== Lyrics Types =====

export interface LyricsLine {
  time: number;
  text: string;
}

export interface LyricsData {
  syncedLyrics?: string;
  plainLyrics?: string;
  lrc?: string;
  lyrics?: string;
}

export interface LyricsApiResponse {
  syncedLyrics?: string;
  plainLyrics?: string;
  lrc?: string;
  lyrics?: string;
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
}

// ===== Player State Types =====

export type QualitySetting = 'Less_low' | 'low' | 'medium' | 'high' | 'auto';

export interface PlayerState {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  shuffleMode: boolean;
  repeatMode: boolean;
  qualitySetting: QualitySetting;
  recentlyPlayed: QueueItem[];
}

export interface PlayerProgress {
  currentTime: number;
  duration: number;
  percentage: number;
}

// ===== UI State Types =====

export type TabType = 'home' | 'search' | 'library';

export interface UIState {
  activeTab: TabType;
  isBannerOpen: boolean;
  isSettingsOpen: boolean;
  isAlbumViewOpen: boolean;
  isLyricsFlipped: boolean;
}

// ===== DOM Element References =====

export interface PlayerElements {
  audio: HTMLAudioElement;
  compactFooter: HTMLElement | null;
  footerTrackImage: HTMLImageElement | null;
  footerTrackTitle: HTMLElement | null;
  footerTrackArtist: HTMLElement | null;
  footerPlayBtn: HTMLElement | null;
  footerPlayIcon: HTMLElement | null;
  footerNextBtn: HTMLElement | null;
  footerProgressFill: HTMLElement | null;
  musicBanner: HTMLElement | null;
  bannerCover: HTMLImageElement | null;
  bannerTitle: HTMLElement | null;
  bannerArtist: HTMLElement | null;
  bannerPlayPauseBtn: HTMLElement | null;
  bannerPlayIcon: HTMLElement | null;
  bannerPrev: HTMLElement | null;
  bannerNext: HTMLElement | null;
  bannerProgressTrack: HTMLElement | null;
  bannerProgressFill: HTMLElement | null;
  bannerProgressHandle: HTMLElement | null;
  currentTimeEl: HTMLElement | null;
  durationEl: HTMLElement | null;
  lyricsContainer: HTMLElement | null;
  lyricsText: HTMLElement | null;
  flipInner: HTMLElement | null;
  shuffleBtn: HTMLElement | null;
  repeatBtn: HTMLElement | null;
  shufflePopup: HTMLElement | null;
  repeatPopup: HTMLElement | null;
  shuffleStatus: HTMLElement | null;
  repeatStatus: HTMLElement | null;
}

// ===== Event Types =====

export interface SeekEvent extends MouseEvent {
  touches?: TouchList;
}

export interface HistoryState {
  tab?: TabType;
  bannerView?: boolean;
  settingsView?: boolean;
  albumView?: boolean;
}

// ===== Media Session Types =====

export interface MediaMetadataInit {
  title: string;
  artist: string;
  album?: string;
  artwork: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export interface MediaSessionActionDetails {
  action: string;
  seekOffset?: number;
  seekTime?: number;
  fastSeek?: boolean;
}

// ===== Storage Types =====

export interface StorageData {
  recentSongs: QueueItem[];
  qualitySetting: QualitySetting;
}

// ===== Utility Types =====

export interface TimeFormat {
  minutes: number;
  seconds: number;
  formatted: string;
}

export interface ImageFallback {
  url: string;
  fallback: string;
}

// ===== Error Types =====

export class MusicPlayerError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'MusicPlayerError';
    this.code = code;
    this.details = details;
  }
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

// ===== Component Props Types =====

export interface MusicCardProps {
  item: Song | Album | QueueItem;
  onClick: () => void;
}

export interface SearchResultProps {
  results: Song[];
  onSelect: (song: Song, index: number) => void;
}

export interface AlbumViewProps {
  album: Album;
  onBack: () => void;
  onPlaySong: (song: Song, index: number) => void;
  onPlayAll: () => void;
}

// ===== Configuration Types =====

export interface AppConfig {
  apiBaseUrl: string;
  lyricsApiUrl: string;
  fallbackCover: string;
  maxRecentlyPlayed: number;
  defaultQuality: QualitySetting;
}

// ===== Type Guards =====

export function isSong(obj: unknown): obj is Song {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Song).id === 'string'
  );
}

export function isAlbum(obj: unknown): obj is Album {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'songs' in obj
  );
}

export function isQueueItem(obj: unknown): obj is QueueItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'artist' in obj &&
    'cover' in obj
  );
}

// ===== Enums =====

export enum PlayerAction {
  PLAY = 'play',
  PAUSE = 'pause',
  NEXT = 'next',
  PREVIOUS = 'previous',
  SEEK = 'seek',
  SHUFFLE_TOGGLE = 'shuffle_toggle',
  REPEAT_TOGGLE = 'repeat_toggle',
}

export enum TabView {
  HOME = 'home',
  SEARCH = 'search',
  LIBRARY = 'library',
}

export enum QualityLevel {
  LESS_LOW = 'Less_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  AUTO = 'auto',
}

// ===== Constants Types =====

export interface QualityOption {
  value: QualitySetting;
  label: string;
  bitrate: string;
}

export const QUALITY_OPTIONS: QualityOption[] = [
  { value: 'Less_low', label: 'Less Low', bitrate: '48 kbps' },
  { value: 'low', label: 'Low', bitrate: '96 kbps' },
  { value: 'medium', label: 'Medium', bitrate: '160 kbps' },
  { value: 'high', label: 'High', bitrate: '320 kbps' },
  { value: 'auto', label: 'Auto', bitrate: 'Best' },
];
