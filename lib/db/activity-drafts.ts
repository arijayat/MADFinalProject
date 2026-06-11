import type { ActivityId } from '@/constants/activities';
import type { ActivitySessionSnapshot } from '@/lib/firestore/results';
import { sessionFromActivityResult } from '@/lib/activity-snapshot';
import type { ActivityResultDocument } from '@/types/firestore';

import { getDatabase } from './database';

export type DraftSyncStatus = 'local' | 'pending' | 'synced';

type SessionLike = ReturnType<typeof sessionFromActivityResult>;

export async function saveActivityDraft(
  teamId: string,
  activityId: ActivityId,
  snapshot: ActivitySessionSnapshot,
  syncStatus: DraftSyncStatus = 'local',
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  const now = Date.now();
  db.runSync(
    `INSERT INTO activity_drafts (team_id, activity_id, snapshot_json, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (team_id, activity_id) DO UPDATE SET
       snapshot_json = excluded.snapshot_json,
       updated_at = excluded.updated_at,
       sync_status = excluded.sync_status`,
    [teamId, activityId, JSON.stringify(snapshot), now, syncStatus],
  );
}

export async function loadActivityDraft(
  teamId: string,
  activityId: ActivityId,
): Promise<SessionLike | null> {
  const db = await getDatabase();
  if (!db) return null;

  const row = db.getFirstSync<{ snapshot_json: string }>(
    `SELECT snapshot_json FROM activity_drafts WHERE team_id = ? AND activity_id = ?`,
    [teamId, activityId],
  );
  if (!row) return null;

  try {
    return JSON.parse(row.snapshot_json) as SessionLike;
  } catch {
    return null;
  }
}

export async function loadAllActivityDrafts(
  teamId: string,
): Promise<Partial<Record<ActivityId, SessionLike>>> {
  const db = await getDatabase();
  if (!db) return {};

  const rows = db.getAllSync<{ activity_id: string; snapshot_json: string }>(
    `SELECT activity_id, snapshot_json FROM activity_drafts WHERE team_id = ?`,
    [teamId],
  );

  const result: Partial<Record<ActivityId, SessionLike>> = {};
  for (const row of rows) {
    try {
      result[row.activity_id as ActivityId] = JSON.parse(
        row.snapshot_json,
      ) as SessionLike;
    } catch {
      // skip corrupt row
    }
  }
  return result;
}

export async function deleteActivityDraft(
  teamId: string,
  activityId: ActivityId,
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  db.runSync(
    `DELETE FROM activity_drafts WHERE team_id = ? AND activity_id = ?`,
    [teamId, activityId],
  );
}

export function sessionFromDraftOrCloud(
  draft: SessionLike | null | undefined,
  cloud: ActivityResultDocument | null | undefined,
): SessionLike {
  if (!draft && !cloud) {
    return sessionFromActivityResult({} as ActivityResultDocument);
  }
  if (!draft) return sessionFromActivityResult(cloud!);
  if (!cloud) return draft;

  return {
    predictions: { ...sessionFromActivityResult(cloud).predictions, ...draft.predictions },
    decibelReadings:
      draft.decibelReadings.length > 0
        ? draft.decibelReadings
        : sessionFromActivityResult(cloud).decibelReadings,
    vibrationReadings:
      draft.vibrationReadings.length > 0
        ? draft.vibrationReadings
        : sessionFromActivityResult(cloud).vibrationReadings,
    performanceReadings:
      draft.performanceReadings.length > 0
        ? draft.performanceReadings
        : sessionFromActivityResult(cloud).performanceReadings,
    parachuteReadings:
      draft.parachuteReadings.length > 0
        ? draft.parachuteReadings
        : sessionFromActivityResult(cloud).parachuteReadings,
    tapReactionReadings:
      draft.tapReactionReadings.length > 0
        ? draft.tapReactionReadings
        : sessionFromActivityResult(cloud).tapReactionReadings,
    tracingReadings:
      draft.tracingReadings.length > 0
        ? draft.tracingReadings
        : sessionFromActivityResult(cloud).tracingReadings,
    breathingReadings:
      draft.breathingReadings.length > 0
        ? draft.breathingReadings
        : sessionFromActivityResult(cloud).breathingReadings,
    fanAngleReadings:
      draft.fanAngleReadings.length > 0
        ? draft.fanAngleReadings
        : sessionFromActivityResult(cloud).fanAngleReadings,
    bounceActual: draft.bounceActual ?? sessionFromActivityResult(cloud).bounceActual,
    parachuteDesignPhotoUrl:
      draft.parachuteDesignPhotoUrl ??
      sessionFromActivityResult(cloud).parachuteDesignPhotoUrl,
    parachuteDesignPhotoExpiresAtMs:
      draft.parachuteDesignPhotoExpiresAtMs ??
      sessionFromActivityResult(cloud).parachuteDesignPhotoExpiresAtMs,
    performer: draft.performer ?? sessionFromActivityResult(cloud).performer ?? null,
  };
}
