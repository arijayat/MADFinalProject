import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'stemmlab.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

function createSchema(database: SQLite.SQLiteDatabase) {
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS activity_drafts (
      team_id TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'local',
      PRIMARY KEY (team_id, activity_id)
    );

    CREATE TABLE IF NOT EXISTS upload_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      action_index INTEGER NOT NULL,
      local_uri TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_upload_queue_team_activity
      ON upload_queue (team_id, activity_id, action_index);
  `);
}

export function isSqliteAvailable(): boolean {
  return Platform.OS !== 'web';
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (!isSqliteAvailable()) return null;
  if (db) return db;
  if (!initPromise) {
    initPromise = Promise.resolve().then(() => {
      const database = SQLite.openDatabaseSync(DB_NAME);
      createSchema(database);
      db = database;
      return database;
    });
  }
  return initPromise;
}
