import type { Request, Response } from 'express';
import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';

const app = createApp();

let dbConnection: Promise<void> | null = null;

function ensureDB(): Promise<void> {
  if (!dbConnection) {
    dbConnection = connectDB().catch((err) => {
      dbConnection = null;
      throw err;
    });
  }
  return dbConnection;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  await ensureDB();
  app(req, res);
}
