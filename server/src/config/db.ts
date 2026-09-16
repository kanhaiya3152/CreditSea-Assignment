import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';
import { logInfo } from '../utils/logger';

/** Strips credentials so the connection string is safe to log (mongoUri includes a plaintext password). */
function redactUri(uri: string): string {
  return uri.replace(/\/\/[^@/]+@/, '//****:****@');
}

export async function connectDB(): Promise<void> {
  // On some Windows/Docker Desktop setups, the active DNS server (often a WSL2
  // virtual adapter) refuses the SRV/TXT lookups that `mongodb+srv://` URIs need,
  // even though the OS resolver (and tools like Compass) handle them fine. Node's
  // own resolver then fails with `querySrv ECONNREFUSED`. Falling back to a public
  // resolver for SRV URIs sidesteps that without requiring any machine-level config.
  if (env.mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logInfo(`db connected to ${redactUri(env.mongoUri)}`);
}
