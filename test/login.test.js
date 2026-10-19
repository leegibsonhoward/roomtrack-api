import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

import { authenticateUser } from "../src/auth/authenticateUser.js";

process.env.DB_PATH = ":memory:";
import { db } from '../src/app.js';

beforeEach(()=>{
  db.exec(`
    DELETE FROM users;
  `);
});

test("authenticates a valid user", async () => {
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
    "valid-user",
    passwordHash,
    "admin",
    1
  );

  const result = await authenticateUser(
    db,
    "valid-user",
    "password123"
  );

  assert.equal(result.success, true);
  assert.equal(result.user.username, "valid-user");
  assert.equal(result.user.role, "admin");
});

test("fails when username does not exist", async () => {
  const result = await authenticateUser(
    db,
    "missing-user",
    "password123"
  );

  assert.equal(result.success, false);
});

test("fails when password is incorrect", async () => {
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
    "pw-incorrect-user",
    passwordHash,
    "admin",
    1
  );

  const result = await authenticateUser(
    db,
    "pw-incorrect-user",
    "wrong-password"
  );

  assert.equal(result.success, false);
});

test("fails when user is inactive", async () => {
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
    "inactive-user",
    passwordHash,
    "admin",
    0
  );

  const result = await authenticateUser(
    db,
    "inactive-user",
    "password123"
  );

  assert.equal(result.success, false);
});