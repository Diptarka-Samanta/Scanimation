export interface FrameItem {
  id: string;
  name: string;
  dataUrl: string; // Base64 or Object URL
  thumbnail?: string;
  source: "upload" | "preset" | "ai";
}

export type FilterMode = "silhouette" | "inverted" | "edges" | "color" | "raw";

export interface ProcessingSettings {
  filterMode: FilterMode;
  threshold: number; // 0-255
  contrast: number; // 0-200%
  slitWidth: number; // 1, 2, 3, 4, or 5 px
  autoCenter: boolean;
}

export interface PresetAnimation {
  id: string;
  title: string;
  description: string;
  category: "animals" | "anatomy" | "mechanics" | "nature";
  iconName: string;
  generateFrames: () => string[]; // returns 5 data URLs (SVG or PNG)
}

export type InputMode = "frames" | "scanimated_image";

export interface AIAnalysisResult {
  subjectName: string;
  recommendedOrder: number[];
  loopQuality: string;
  contrastTip: string;
  motionDescription: string;
}

export interface PitchDetectionCandidate {
  period: number;
  slitWidth: number;
  frameCount: number;
  confidence: number; // 0-100%
  score: number;
}

export interface PitchDetectionResult {
  bestSlitWidth: number;
  bestPeriod: number;
  confidence: number;
  candidates: PitchDetectionCandidate[];
  autocorrelationProfile?: { lag: number; val: number }[];
}

export interface DirectScanimationData {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  slitWidth: number;
  frameCount: number;
  extractedFrames: FrameItem[];
}

export type SavedScanimationType = "generated" | "uploaded";

export interface SavedScanimationItem {
  id: string;
  title: string;
  description?: string;
  type: SavedScanimationType;
  compositeDataUrl: string;
  gratingDataUrl: string;
  thumbnailDataUrl?: string;
  slitWidth: number;
  frameCount: number;
  createdAt: number; // timestamp in ms
  dimensions: { width: number; height: number };
  frames?: FrameItem[];
  settings?: ProcessingSettings;
  tags?: string[];
}
