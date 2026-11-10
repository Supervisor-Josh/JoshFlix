import Database from '@tauri-apps/plugin-sql';

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:joshflix.db');
  }
  return dbInstance;
}

export async function saveScannedMedia(items) {
  const db = await getDB();
  for (const item of items) {
    await db.execute(
      `INSERT OR IGNORE INTO media_items (title, path, media_type, category, size) VALUES (?, ?, ?, ?, ?)`,
      [item.title, item.path, item.media_type, item.category, item.size]
    );
  }
}

export async function getStoredMedia() {
  const db = await getDB();
  return await db.select('SELECT * FROM media_items ORDER BY id DESC');
}

export async function getSetting(key, fallback = '') {
  const db = await getDB();
  const res = await db.select('SELECT value FROM user_settings WHERE key = ?', [key]);
  return res.length > 0 ? res[0].value : fallback;
}

export async function saveSetting(key, value) {
  const db = await getDB();
  await db.execute(
    'INSERT INTO user_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    [key, value, value]
  );
}

export async function saveWatchProgress(path, progress, duration) {
  const db = await getDB();
  await db.execute(
    `INSERT INTO watch_history (path, progress, duration, updated_at) 
     VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
     ON CONFLICT(path) DO UPDATE SET progress = ?, duration = ?, updated_at = CURRENT_TIMESTAMP`,
    [path, progress, duration, progress, duration]
  );
}

export async function getWatchProgress(path) {
  const db = await getDB();
  const res = await db.select('SELECT progress, duration FROM watch_history WHERE path = ?', [path]);
  return res.length > 0 ? res[0] : { progress: 0, duration: 0 };
}

export async function setMediaDeletedStatus(id, isDeleted) {
  const db = await getDB();
  await db.execute('UPDATE media_items SET is_deleted = ? WHERE id = ?', [isDeleted ? 1 : 0, id]);
}

export async function permanentlyDeleteMedia(id) {
  const db = await getDB();
  await db.execute('DELETE FROM media_items WHERE id = ?', [id]);
}