import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

export async function ask(label: string, hidden = false) {
  if (!process.stdin.isTTY) throw new Error('Use an interactive terminal; passwords are not accepted in command arguments.');
  let muted = false;
  const output = new Writable({ write(chunk, _encoding, callback) { if (!muted) process.stdout.write(chunk); callback(); } });
  const input = createInterface({ input: process.stdin, output, terminal: true });
  try {
    process.stdout.write(label);
    muted = hidden;
    return await input.question('');
  } finally {
    input.close();
    if (hidden) process.stdout.write('\n');
  }
}
export async function accountInput() {
  return {
    name: (await ask('Name: ')).trim(), email: (await ask('Email: ')).trim(),
    password: await ask('Password (12–128 characters, hidden): ', true),
  };
}
