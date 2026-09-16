import dns from 'dns';
import mongoose from 'mongoose';
import { env, isProduction } from './env';
import { logInfo } from '../utils/logger';

/** Strips credentials so the connection string is safe to log (mongoUri includes a plaintext password). */
function redactUri(uri: string): string {
  return uri.replace(/\/\/[^@/]+@/, '//****:****@');
}

export async function connectDB(): Promise<void> {
  // Local-only workaround: on some Windows/Docker Desktop setups the active DNS server
  // (often a WSL2 virtual adapter) refuses the SRV/TXT lookups that `mongodb+srv://`
  // URIs need, and Node fails with `querySrv ECONNREFUSED`. It must not run in
  // production - on a serverless host the platform resolver is already correct, and
  // forcing lookups out to public DNS just adds latency to every cold start.
  if (!isProduction && env.mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    // One serverless invocation handles one request at a time, so a large pool is
    // wasted connections against the Atlas free-tier cap.
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10_000,
  });
  logInfo(`db connected to ${redactUri(env.mongoUri)}`);
}
