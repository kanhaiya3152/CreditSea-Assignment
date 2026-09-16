import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

export const isCloudinaryConfigured =
  Boolean(env.cloudinaryCloudName) && Boolean(env.cloudinaryApiKey) && Boolean(env.cloudinaryApiSecret);

export { cloudinary };
