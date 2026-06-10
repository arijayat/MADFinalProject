import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Persistence } from 'firebase/auth';

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function getStorageDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('firebase-auth-storage.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS auth_storage (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      return db;
    });
  }

  return dbPromise;
}

const firebaseAuthStorage = {
  async getItem(key: string) {
    const db = await getStorageDb();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM auth_storage WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  },
  async setItem(key: string, value: string) {
    const db = await getStorageDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO auth_storage (key, value) VALUES (?, ?)',
      key,
      value,
    );
  },
  async removeItem(key: string) {
    const db = await getStorageDb();
    await db.runAsync('DELETE FROM auth_storage WHERE key = ?', key);
  },
};

export function getFirebaseAuthPersistence(): Persistence {
  class ExpoSQLitePersistence {
    static readonly type = 'LOCAL' as const;
    readonly type = 'LOCAL' as const;

    async _isAvailable() {
      try {
        await firebaseAuthStorage.setItem('__firebase_auth_storage_test__', '1');
        await firebaseAuthStorage.removeItem('__firebase_auth_storage_test__');
        return true;
      } catch {
        return false;
      }
    }

    async _set(key: string, value: unknown) {
      await firebaseAuthStorage.setItem(key, JSON.stringify(value));
    }

    async _get<T>(key: string): Promise<T | null> {
      const json = await firebaseAuthStorage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }

    async _remove(key: string) {
      await firebaseAuthStorage.removeItem(key);
    }

    _addListener() {
      return;
    }

    _removeListener() {
      return;
    }
  }

  return ExpoSQLitePersistence as unknown as Persistence;
}
