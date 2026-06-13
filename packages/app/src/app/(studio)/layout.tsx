import { StudioProvider } from '@/components/studio/StudioProvider';
import { StudioShell } from '@/components/studio/StudioShell';

/** Layout for the whole authenticated Studio area: auth gate + sidebar shell. */
export default function StudioGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudioProvider>
      <StudioShell>{children}</StudioShell>
    </StudioProvider>
  );
}
