/**
 * Creates the RoomTrack database schema.
 *
 * Safe to call multiple times during:
 * - application startup
 * - user provisioning
 * - room provisioning
 * - automated tests
 *
 * Existing tables are left unchanged.
 */
export function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY,
      room_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      condition TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);
  
}