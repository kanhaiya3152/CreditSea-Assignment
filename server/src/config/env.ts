import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Allowed browser origins, as a comma-separated list. Trailing slashes are stripped
 * because the browser's `Origin` header never has one, and a stray slash in the env
 * var would otherwise silently fail every CORS check. An empty value allows any
 * origin: auth is a bearer token rather than a cookie, so a permissive origin can't
 * be leveraged to ride on a logged-in browser session the way it could with cookies.
 */
function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/lms'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  // Optional at boot so a missing Cloudinary key degrades to "uploads fail" rather than
  // crashing the whole process on cold start and taking login down with it.
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
};

export const isProduction = env.nodeEnv === 'production';
