export const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'general', label: 'General' },
];

export const TONES = [
  { id: 'casual', label: 'Casual' },
  { id: 'bold', label: 'Bold' },
  { id: 'curious', label: 'Curious' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'professional', label: 'Professional' },
];

export const TYPE_COLORS: Record<string, string> = {
  curiosity: 'bg-blue-900/50 text-blue-300 border-blue-800',
  fear_fomo: 'bg-red-900/50 text-red-300 border-red-800',
  contrarian: 'bg-orange-900/50 text-orange-300 border-orange-800',
  pain_point: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  how_to: 'bg-green-900/50 text-green-300 border-green-800',
  list: 'bg-cyan-900/50 text-cyan-300 border-cyan-800',
  story: 'bg-purple-900/50 text-purple-300 border-purple-800',
  shocking_stat: 'bg-pink-900/50 text-pink-300 border-pink-800',
  question: 'bg-indigo-900/50 text-indigo-300 border-indigo-800',
};

export const TYPE_LABELS: Record<string, string> = {
  curiosity: 'Curiosity',
  fear_fomo: 'FOMO',
  contrarian: 'Contrarian',
  pain_point: 'Pain Point',
  how_to: 'How-To',
  list: 'List',
  story: 'Story',
  question: 'Question',
  shocking_stat: 'Stat',
  challenge: 'Challenge',
  personal: 'Personal',
  social_proof: 'Social Proof',
};

export const SOURCE_ICONS: Record<string, string> = {
  youtube: '▶',
  reddit: '⬆',
  twitter: '𝕏',
  manual: '✦',
};
