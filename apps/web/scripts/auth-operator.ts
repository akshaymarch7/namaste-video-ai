import { createDatabaseConnection } from '../src/db/client';
import { DatabaseError, readDatabaseConfig } from '../src/db/config';
import { readAuthConfig } from '../src/auth/config';
import { setupAuth } from '../src/auth/setup';
import { disableUser, provisionUser } from '../src/auth/operator';
import { accountInput, ask } from './auth-input';

let connection: ReturnType<typeof createDatabaseConnection> | undefined;
try {
  const action = process.argv[2];
  if (!['setup', 'provision', 'disable'].includes(action ?? '')) throw new DatabaseError('INVALID_COMMAND', 'Use auth:operator -- setup, provision or disable.');
  connection = createDatabaseConnection(readDatabaseConfig(process.env, 'setup'));
  const { client, db } = await connection.get();
  const config = readAuthConfig();
  if (action === 'setup') { await setupAuth(db, client, config); console.log('Authentication collections and indexes ready.'); }
  if (action === 'provision') {
    console.log('Provision only after verifying email ownership outside this application. Existing passwords are never reset by this command.');
    await provisionUser(db, client, config, await accountInput());
    console.log('Account provisioned. No session was created.');
  }
  if (action === 'disable') { await disableUser(db, await ask('Email to disable: ')); console.log('Access disabled; current sessions revoked.'); }
} catch (error) {
  console.error(error instanceof DatabaseError ? `${error.code}: ${error.message}` : 'AUTH_OPERATOR_FAILED: Operation failed; verify configuration, setup and input.');
  process.exitCode = 1;
} finally { await connection?.close(); }
