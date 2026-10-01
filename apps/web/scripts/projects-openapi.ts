import { writeFile } from 'node:fs/promises';
import { projectsOpenApi } from '../src/projects/openapi';
await writeFile(new URL('../../../design/projects.openapi.json', import.meta.url), `${JSON.stringify(projectsOpenApi(), null, 2)}\n`);
console.log('Updated design/projects.openapi.json');
