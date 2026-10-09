import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

test("creates users table", () => {
  const db = new DatabaseSync(":memory:");

  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  const tables = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      AND name = 'users'
    `)
    .all();

  assert.equal(tables.length, 1);
});