import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { DatabaseSync } from "node:sqlite";

import { authenticateUser } from "../src/auth/authenticateUser.js";

function createUsersTable(db) {
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);
}

test("authenticates a valid user", async () => {
  const db = new DatabaseSync(":memory:");

  createUsersTable(db);

  const passwordHash = await bcrypt.hash("password123", 12);

  db.prepare(`
    INSERT INTO users (
      username,
      password_hash,
      role,
      active
    )
    VALUES (?, ?, ?, ?)
  `).run(
    "lee",
    passwordHash,
    "admin",
    1
  );

  const result = await authenticateUser(
    db,
    "lee",
    "password123"
  );

  assert.equal(result.success, true);
  assert.equal(result.user.username, "lee");
  assert.equal(result.user.role, "admin");
});

test("fails when username does not exist", async () => {
  const db = new DatabaseSync(":memory:");

  createUsersTable(db);

  const result = await authenticateUser(
    db,
    "missing-user",
    "password123"
  );

  assert.equal(result.success, false);
});

test("fails when password is incorrect", async () => {
  const db = new DatabaseSync(":memory:");

  createUsersTable(db);

  const passwordHash = await bcrypt.hash("password123", 12);

  db.prepare(`
    INSERT INTO users (
      username,
      password_hash,
      role,
      active
    )
    VALUES (?, ?, ?, ?)
  `).run(
    "lee",
    passwordHash,
    "admin",
    1
  );

  const result = await authenticateUser(
    db,
    "lee",
    "wrong-password"
  );

  assert.equal(result.success, false);
});

test("fails when user is inactive", async () => {
  const db = new DatabaseSync(":memory:");

  createUsersTable(db);

  const passwordHash = await bcrypt.hash("password123", 12);

  db.prepare(`
    INSERT INTO users (
      username,
      password_hash,
      role,
      active
    )
    VALUES (?, ?, ?, ?)
  `).run(
    "lee",
    passwordHash,
    "admin",
    0
  );

  const result = await authenticateUser(
    db,
    "lee",
    "password123"
  );

  assert.equal(result.success, false);
});