import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { provisionRooms } from "../src/provisionRooms.js";
import { initializeDatabase } from '../src/db/initializaDatabase.js';

const db = new DatabaseSync(":memory:");
initializeDatabase(db);

// TODO: extract and use initializeDatabase instead

test("provisions 74 rooms", () => {
  provisionRooms(db);

  const statement = db.prepare(
    "SELECT COUNT(*) AS count FROM rooms"
  );

  const result = statement.get();

  assert.equal(result.count, 74);
});

test("provisioning twice does not create duplicates", () => {
  provisionRooms(db);
  provisionRooms(db);

  const statement = db.prepare(
    "SELECT COUNT(*) AS count FROM rooms"
  );

  const result = statement.get();

  assert.equal(result.count, 74);
});

test("provisions expected room numers", () => {
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

test("provisions standard assets", () => {
  provisionRooms(db);

  const assetCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM assets
  `).get();

  assert.equal(assetCount.count, 888);
});

test("room contains required asset quantities", () => {
  provisionRooms(db);

  const room = db.prepare(`
    SELECT id
    FROM rooms
    WHERE number = 101
  `).get();

  const assets = db.prepare(`
    SELECT
      type,
      COUNT(*) AS count
    FROM assets
    WHERE room_id = ?
    GROUP BY type
  `).all(room.id);

  const byType = Object.fromEntries(
    assets.map(asset => [
      asset.type,
      asset.count,
    ])
  );

  assert.equal(byType.phone, 1);
  assert.equal(byType.tv, 1);
  assert.equal(byType.microwave, 1);
  assert.equal(byType.refrigerator, 1);
  assert.equal(byType.coffee_pot, 1);
  assert.equal(byType.alarm_clock, 1);
  assert.equal(byType.shower_curtain, 1);
  assert.equal(byType.bed, 1);
  assert.equal(byType.chair, 1);
  assert.equal(byType.table, 1);
  assert.equal(byType.nightstand, 2);
});