import type { VideoActivityId } from '@/lib/storage/activity-video';

import { getDatabase } from './database';

export type UploadQueueStatus = 'pending' | 'uploading' | 'done' | 'failed';

export type UploadQueueItem = {
  id: number;
  teamId: string;
  activityId: VideoActivityId;
  actionIndex: number;
  localUri: string;
  status: UploadQueueStatus;
  errorMessage: string | null;
};

export async function upsertUploadQueueItem(params: {
  teamId: string;
  activityId: VideoActivityId;
  actionIndex: number;
  localUri: string;
}): Promise<number> {
  const db = await getDatabase();
  if (!db) return -1;

  const now = Date.now();
  const existing = db.getFirstSync<{ id: number }>(
    `SELECT id FROM upload_queue
     WHERE team_id = ? AND activity_id = ? AND action_index = ?`,
    [params.teamId, params.activityId, params.actionIndex],
  );

  if (existing) {
    db.runSync(
      `UPDATE upload_queue
       SET local_uri = ?, status = 'pending', error_message = NULL, updated_at = ?
       WHERE id = ?`,
      [params.localUri, now, existing.id],
    );
    return existing.id;
  }

  const result = db.runSync(
    `INSERT INTO upload_queue
       (team_id, activity_id, action_index, local_uri, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [
      params.teamId,
      params.activityId,
      params.actionIndex,
      params.localUri,
      now,
      now,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateUploadQueueStatus(
  id: number,
  status: UploadQueueStatus,
  errorMessage?: string | null,
): Promise<void> {
  const db = await getDatabase();
  if (!db || id < 0) return;

  db.runSync(
    `UPDATE upload_queue SET status = ?, error_message = ?, updated_at = ? WHERE id = ?`,
    [status, errorMessage ?? null, Date.now(), id],
  );
}

export async function getUploadQueueItem(
  teamId: string,
  activityId: VideoActivityId,
  actionIndex: number,
): Promise<UploadQueueItem | null> {
  const db = await getDatabase();
  if (!db) return null;

  const row = db.getFirstSync<{
    id: number;
    team_id: string;
    activity_id: string;
    action_index: number;
    local_uri: string;
    status: UploadQueueStatus;
    error_message: string | null;
  }>(
    `SELECT id, team_id, activity_id, action_index, local_uri, status, error_message
     FROM upload_queue
     WHERE team_id = ? AND activity_id = ? AND action_index = ?
     ORDER BY updated_at DESC
     LIMIT 1`,
    [teamId, activityId, actionIndex],
  );

  if (!row) return null;
  return {
    id: row.id,
    teamId: row.team_id,
    activityId: row.activity_id as VideoActivityId,
    actionIndex: row.action_index,
    localUri: row.local_uri,
    status: row.status,
    errorMessage: row.error_message,
  };
}

export async function listPendingUploads(
  teamId: string,
  activityId: VideoActivityId,
): Promise<UploadQueueItem[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = db.getAllSync<{
    id: number;
    team_id: string;
    activity_id: string;
    action_index: number;
    local_uri: string;
    status: UploadQueueStatus;
    error_message: string | null;
  }>(
    `SELECT id, team_id, activity_id, action_index, local_uri, status, error_message
     FROM upload_queue
     WHERE team_id = ? AND activity_id = ? AND status IN ('pending', 'failed')
     ORDER BY action_index ASC`,
    [teamId, activityId],
  );

  return rows.map((row) => ({
    id: row.id,
    teamId: row.team_id,
    activityId: row.activity_id as VideoActivityId,
    actionIndex: row.action_index,
    localUri: row.local_uri,
    status: row.status,
    errorMessage: row.error_message,
  }));
}
