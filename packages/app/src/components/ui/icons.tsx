/**
 * Bolt — the HookGenOS brand mark: a filled lightning bolt ("stop the
 * scroll" energy). Recurs as the logo glyph, the ⚡ generate affordance,
 * and the score pill. Filled (not Lucide's stroke Zap) to match the brand.
 */
export function Bolt({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
