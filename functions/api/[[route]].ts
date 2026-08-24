import { handle } from 'hono/cloudflare-pages';
import worker from '../../src/worker';

export const onRequest = handle(worker);
