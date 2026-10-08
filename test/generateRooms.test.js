import test from "node:test";
import assert from "node:assert/strict";

import {
  generateRooms,
  productionRoomRanges,
} from "../src/generateRooms.js";

test("generates 74 production rooms", () => {
  const rooms = generateRooms(productionRoomRanges);

  assert.equal(rooms.length, 74);
});

test("does not include excluded rooms", () => {
  const rooms = generateRooms(productionRoomRanges);

  const roomNumbers = rooms.map(room => room.number);

  assert.equal(roomNumbers.includes(113), false);
  assert.equal(roomNumbers.includes(213), false);
  assert.equal(roomNumbers.includes(612), false);
  assert.equal(roomNumbers.includes(613), false);
  assert.equal(roomNumbers.includes(616), false);
});

test("includes expected boundary rooms", () => {
  const rooms = generateRooms(productionRoomRanges);

  const roomNumbers = rooms.map(room => room.number);

  assert.equal(roomNumbers.includes(101), true);
  assert.equal(roomNumbers.includes(114), true);
  assert.equal(roomNumbers.includes(201), true);
  assert.equal(roomNumbers.includes(214), true);
  assert.equal(roomNumbers.includes(605), true);
  assert.equal(roomNumbers.includes(655), true);
});
