export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'general';
export type Tone = 'casual' | 'professional' | 'urgent' | 'curious' | 'bold';
export type HookType =
  | 'curiosity'
  | 'fear_fomo'
  | 'contrarian'
  | 'pain_point'
  | 'social_proof'
  | 'how_to'
  | 'list'
  | 'story'
  | 'question'
  | 'shocking_stat'
  | 'personal'
  | 'challenge';

export interface GenerateOptions {
  topic: string;
  platform: Platform;
  niche?: string;
  tone: Tone;
  count: number;
  useAI?: boolean;
}

export interface Hook {
  text: string;
  type: HookType;
  score: number;
  platform: Platform;
  explanation?: string;
}

export interface Template {
  id: string;
  type: HookType;
  template: string;
  score: number;
  platforms: Platform[];
  tones: Tone[];
  example: string;
}
