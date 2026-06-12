import { z } from 'zod';

export const trendingHookSchema = z.object({
  text: z.string().min(1).max(500),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'linkedin', 'twitter', 'reddit']),
  hookType: z.string().min(1),
  score: z.number().int().min(0).max(100).default(80),
  niche: z.string().max(100).optional(),
  sourceType: z.enum(['youtube', 'reddit', 'twitter', 'manual']).default('manual'),
  viewCount: z.number().optional(),
  explanation: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

export const bulkTrendingSchema = z.object({
  hooks: z.array(trendingHookSchema).min(1).max(200),
});

export const toggleActiveSchema = z.object({ isActive: z.boolean() });

export const listTrendingQuerySchema = z.object({
  platform: z.string().optional(),
  niche: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
});
