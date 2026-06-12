// Side-effect module: load .env before any other module reads process.env.
// Imported first in index.ts — import ordering guarantees this runs early.
import { config } from 'dotenv';

config({ quiet: true });
