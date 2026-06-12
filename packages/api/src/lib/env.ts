// Side-effect module: load .env before any other module reads process.env.
// Imported first in index.ts — import ordering guarantees this runs early.
import { config } from 'dotenv';
import { resolve } from 'path';

// Try package-local .env first; fall back to monorepo root (4 levels up from dist/lib or src/lib).
config({ quiet: true });
config({ path: resolve(__dirname, '../../../../.env'), quiet: true, override: false });
