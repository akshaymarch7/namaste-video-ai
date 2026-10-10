import {measureStage} from '../diagnostics/timing';
import 'server-only';
import { MongoClient, type ClientSession, type Db } from 'mongodb';
import { DatabaseError, readDatabaseConfig, type DatabaseConfig } from './config';

export function createDatabaseConnection(config: DatabaseConfig) {
  let pending: Promise<MongoClient> | undefined;
  let connected: MongoClient | undefined;
  return {
    async get(): Promise<{ client: MongoClient; db: Db }> {
      if (!pending) {
        pending = (async () => {
          let candidate: MongoClient | undefined;
          try {
            candidate = new MongoClient(config.uri, {
              appName: 'namastevideo-web', maxPoolSize: 10, minPoolSize: 0,
              maxIdleTimeMS: 60_000, serverSelectionTimeoutMS: 5_000,
              connectTimeoutMS: 5_000, waitQueueTimeoutMS: 5_000,
              promoteLongs: false,
            });
            await candidate.connect();
            connected = candidate;
            return candidate;
          } catch {
            await candidate?.close().catch(() => undefined);
            pending = undefined;
            throw new DatabaseError('DB_UNAVAILABLE', 'Database connection failed. Check server availability and server-only configuration.');
          }
        })();
      }
      const client = await pending;
      return { client, db: client.db(config.database) };
    },
    async close() {
      await pending?.catch(() => undefined);
      await connected?.close();
      connected = undefined;
      pending = undefined;
    },
  };
}

const globals = globalThis as typeof globalThis & {
  namasteDatabase?: ReturnType<typeof createDatabaseConnection>;
};

// Lazy: static pages and builds must not require database credentials.
export function getDatabase() {
  globals.namasteDatabase ??= createDatabaseConnection(readDatabaseConfig());
  return globals.namasteDatabase.get();
}

// Callbacks may be retried: only sequential database operations belong here.
export async function inTransaction<T>(
  client: MongoClient,
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = client.startSession();
  try {
    return await measureStage('transaction',()=>session.withTransaction(() => operation(session), {
      readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' },
      readPreference: 'primary', maxCommitTimeMS: 10_000,
    }));
  } finally {
    await session.endSession();
  }
}
