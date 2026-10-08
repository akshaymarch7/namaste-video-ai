import {setupScheduling} from '../src/publishing/schedule-setup';
import {setupPublishing} from '../src/publishing/setup';
import {setupCloudDispatch} from '../src/cloud/setup';
import {setupInstagram} from '../src/instagram/setup';
import {setupVideos} from '../src/videos/setup';
import {backfillVideos} from '../src/videos/materialize';
import {repairGenerationProjectFlags} from '../src/jobs/repair-project-flags';
import {setupJobs} from '../src/jobs/setup';
import {setupStorage} from '../src/storage/setup';
import {setupStoryboardApprovals} from '../src/storyboards/approval-setup';
import {setupStoryboardSnapshots} from '../src/storyboards/snapshot-setup';
import {setupStoryboardRevisions} from '../src/storyboards/revision-setup';
import {setupEditableDrafts} from '../src/drafts/edit-setup';
import { setupStoryboardQueue } from '../src/storyboards/queue-setup';
import { setupStoryboards } from '../src/storyboards/setup';
import { setupIdeas } from '../src/ideas/setup';
import { setupDrafts } from '../src/drafts/setup';
import { setupProjects } from '../src/projects/setup';
import { createDatabaseConnection } from '../src/db/client';
import { DatabaseError, readDatabaseConfig } from '../src/db/config';
import { setupDatabase } from '../src/db/setup';

let connection: ReturnType<typeof createDatabaseConnection> | undefined;
try {
  connection = createDatabaseConnection(readDatabaseConfig(process.env, 'setup'));
  const { db, client } = await connection.get();
  const result = await setupDatabase(db);
  const projects = await setupProjects(db);
  const drafts = await setupDrafts(db);
  const ideas = await setupIdeas(db);
  const storyboards = await setupStoryboards(db); const queue = await setupStoryboardQueue(db); const editable = await setupEditableDrafts(db); const revisions = await setupStoryboardRevisions(db); const snapshots = await setupStoryboardSnapshots(db); const approvals = await setupStoryboardApprovals(db);const storage = await setupStorage(db); const jobs = await setupJobs(db);
  const videos = await setupVideos(db);
  const instagram = await setupInstagram(db);
  const cloud = await setupCloudDispatch(db);
  const publishing = await setupPublishing(db);
  const scheduling = await setupScheduling(db);
  const repairs = {...await repairGenerationProjectFlags(db,client),...await backfillVideos(db,client)};
  console.log(JSON.stringify({ status: 'ok', repairs, migrations: [result, projects, drafts, ideas, storyboards, queue, editable, revisions, snapshots, approvals, storage, jobs, videos, instagram, cloud, publishing, scheduling] }));
} catch (error) {
  // Driver diagnostics can include connection strings or document data. Do not print them.
  console.error(JSON.stringify({
    status: 'error', code: error instanceof DatabaseError ? error.code : 'DB_SETUP_FAILED',
    message: error instanceof DatabaseError ? error.message : 'Database setup failed. Check operator privileges, existing indexes and server availability.',
  }));
  process.exitCode = 1;
} finally {
  await connection?.close();
}
