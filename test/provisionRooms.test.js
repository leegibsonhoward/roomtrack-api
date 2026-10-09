import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { provisionRooms } from "../src/provisionRooms.js";

test("provisions 74 rooms", () => {
  const db = new DatabaseSync(":memory:");

  db.exec(`
    CREATE TABLE rooms (
      id INTEGER PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE
    )
  `);

  provisionRooms(db);

  const statement = db.prepare(
    "SELECT COUNT(*) AS count FROM rooms"
  );

  const result = statement.get();

  assert.equal(result.count, 74);
});

test("provisioning twice does not create duplicates", () => {
  const db = new DatabaseSync(":memory:");

  db.exec(`
    CREATE TABLE rooms (
      id INTEGER PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE
    )
  `);

  provisionRooms(db);
  provisionRooms(db);

  const statement = db.prepare(
    "SELECT COUNT(*) AS count FROM rooms"
  );

  const result = statement.get();

  assert.equal(result.count, 74);
});

test("provisions expected room numers", () => {
  const db = new DatabaseSync(":memory:");

  db.exec(`CREATE TABLE rooms (
      id INTEGER PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE
    )
  `);

  provisionRooms(db);

  const statement = db.prepare(
    "SELECT number FROM rooms ORDER BY number"
  );

  const rooms = statement.all();
  const roomNumbers = rooms.map(room => room.number);

  assert.equal(roomNumbers.includes(101), true);
  assert.equal(roomNumbers.includes(655), true);
  assert.equal(roomNumbers.includes(113), false);
  assert.equal(roomNumbers.includes(213), false);
  assert.equal(roomNumbers.includes(612), false);
});