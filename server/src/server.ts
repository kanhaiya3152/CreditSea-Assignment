import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logError, logInfo } from './utils/logger';

async function main(): Promise<void> {
  await connectDB();
  const app = createApp();

  app.listen(env.port, () => {
    logInfo(`server listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  logError('server failed to start', err);
  process.exit(1);
});
