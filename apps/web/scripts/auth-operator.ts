import { createDatabaseConnection } from '../src/db/client';
import { DatabaseError, readDatabaseConfig } from '../src/db/config';
import { readAuthConfig } from '../src/auth/config';
import { setupAuth } from '../src/auth/setup';
import { disableUser, provisionUser } from '../src/auth/operator';
import { accountInput, ask } from './auth-input';
import { recoverPassword } from '../src/auth/recovery';

let connection: ReturnType<typeof createDatabaseConnection> | undefined;
try {
  const action = process.argv[2];
  if (!['setup', 'provision', 'disable', 'recover'].includes(action ?? '')) throw new DatabaseError('INVALID_COMMAND', 'Use auth:operator -- setup, provision, disable or recover.');
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
  if (action === 'recover') {
    console.log('Verify identity out of band before recovery. Passwords and recovery tokens are never printed.');
    const email = await ask('Email to recover: ');
    const password = await ask('New password (hidden): ', true);
    const confirmation = await ask('Confirm new password (hidden): ', true);
    if (password !== confirmation) throw new DatabaseError('RECOVERY_INPUT_INVALID', 'Passwords do not match.');
    await recoverPassword(db, client, config, { email, password });
    console.log('Password recovered. Previous sessions are revoked; sign in with the new password.');
  }
} catch (error) {
  console.error(error instanceof DatabaseError ? `${error.code}: ${error.message}` : 'AUTH_OPERATOR_FAILED: Operation failed; verify configuration, setup and input.');
  process.exitCode = 1;
} finally { await connection?.close(); }
