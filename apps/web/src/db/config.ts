export class DatabaseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export type DatabaseConfig = { uri: string; database: string };

export function readDatabaseConfig(
  env: Record<string, string | undefined> = process.env,
  purpose: 'runtime' | 'setup' = 'runtime',
): DatabaseConfig {
  const key = purpose === 'setup' ? 'MONGODB_MIGRATION_URI' : 'MONGODB_URI';
  const uri = env[key]?.trim();
  const database = env.MONGODB_DATABASE?.trim();
  if (!uri || !database) {
    throw new DatabaseError('DB_CONFIG_MISSING', `Set ${key} and MONGODB_DATABASE in apps/web/.env.local.`);
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new DatabaseError('DB_CONFIG_INVALID', `${key} must be a MongoDB connection URI.`);
  }
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(database) || ['admin', 'local', 'config'].includes(database)) {
    throw new DatabaseError('DB_CONFIG_INVALID', 'Use an explicit application database name: 3–63 lowercase letters, numbers or underscores.');
  }
  return { uri, database };
}
