import express from "express";
import { DatabaseSync } from "node:sqlite";

import { checkRoomRequirements } from "./checkRoomRequirements.js";

// Express setup
export const app = express();
app.use(express.json());

// database setup
const databasePath = process.env.DB_PATH || "roomtrack.db";
const db = new DatabaseSync(databasePath);

// production db room
import { provisionRooms } from "./provisionRooms.js";

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

provisionRooms(db);

// Seed data / initialization
const initialRooms = [
  { id: 1, number: 101 },
  { id: 2, number: 102 },
  { id: 3, number: 103 },
];

// database helper
function seedRooms() {
  const statement = db.prepare(`
    INSERT OR IGNORE INTO rooms (id, number)
    VALUES (?, ?)
  `);

  initialRooms.forEach(room => {
    statement.run(room.id, room.number);
  });
}

// execute seeding on startup
seedRooms();

const allowedConditions = ["good", "damaged"];

const standardRoomRequirements = [
  { type: "phone", quantity: 1 },
  { type: "tv", quantity: 1 },
  { type: "microwave", quantity: 1 },
  { type: "refrigerator", quantity: 1 },
  { type: "coffee_pot", quantity: 1 },
  { type: "alarm_clock", quantity: 1 },
  { type: "shower_curtain", quantity: 1 },
  { type: "bed", quantity: 1 },
  { type: "chair", quantity: 1 },
  { type: "table", quantity: 1 },
  { type: "nightstand", quantity: 2 },
];

//
// Helpers
//

// check if id is a valid number
function isValidId(id) {
  return Number.isInteger(id) || id >= 0;
}

// Get all rooms in database
function findAllRooms() {
  const statement = db.prepare(`SELECT * FROM rooms`);
  return statement.all();
}

// SQLite migration helpers
function findRoomById(roomId) {
  const statement = db.prepare("SELECT * FROM rooms WHERE id = ?");

  const room = statement.get(roomId);

  if (room === undefined) {
    return undefined;
  }

  const assets = findAssetsByRoomId(roomId);

  room.assets = assets;

  return room;
}

function findAssetsByRoomId(roomId) {
  const statement = db.prepare("SELECT * FROM assets WHERE room_id = ?");

  return statement.all(roomId);
}

function findAssetById(room, assetId) {
  const statement = db.prepare(
    "SELECT * FROM assets WHERE id = ? AND room_id = ?",
  );

  return statement.get(assetId, room.id);
}

// CREATE
function createAsset(room, trimmedAssetType) {
  const statement = db.prepare(`
    INSERT INTO assets (room_id, type, condition)
    VALUES (?, ?, ?)  
  `);

  const result = statement.run(room.id, trimmedAssetType, "good");

  const newAsset = findAssetById(room, result.lastInsertRowid);

  return newAsset;
}

// UPDATE
function updateAssetCondition(room, asset, condition) {
  const statement = db.prepare(`
    UPDATE assets
    SET condition = ?
    WHERE id = ? AND room_id = ?
  `);

  statement.run(condition, asset.id, room.id);

  return findAssetById(room, asset.id);
}

// DELETE
function deleteAsset(room, assetId) {
  let deletedAsset = findAssetById(room, assetId);

  if (deletedAsset === undefined) {
    return undefined;
  }

  const statement = db.prepare(`
    DELETE FROM assets
    WHERE id = ? AND room_id = ?
  `);

  statement.run(assetId, room.id);

  return deletedAsset;
}

//
// Routes //////////////////////////////////////////
//
app.get("/", (req, res) => {
  return res.json({
    name: "RoomTrack API",
    version: "v1.0.0",
    message: "Welcome to RoomTrack API",
  });
});

app.get("/status", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
  });
});

// list all rooms
app.get("/rooms", (req, res) => {
  const rooms = findAllRooms();

  return res.status(200).json({
    success: true,
    message: "Room(s) retrieved successfully",
    data: rooms,
  });
});

// create asset for room by ID
app.post("/rooms/:roomId/assets", (req, res) => {
  const roomId = Number(req.params.roomId);

  // check roomId is a positive number
  if (!isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  let room = findRoomById(roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  const assetType = req.body.type;

  // validate user input is a string and not empty
  if (typeof assetType !== "string" || assetType.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Asset type is required",
    });
  }

  const trimmedAssetType = assetType.trim();

  // validate type is allowed
  const foundRequirement = standardRoomRequirements.find(
    requirement => requirement.type === trimmedAssetType,
  );

  if (foundRequirement === undefined) {
    return res.status(400).json({
      success: false,
      message: "Asset type not valid",
    });
  }

  const newAsset = createAsset(room, trimmedAssetType);

  // respond with status code 201 (Created) and return the new item
  return res.status(201).json({
    success: true,
    message: "Asset created successfully",
    data: newAsset,
  });
});

app.get("/rooms/:roomId", (req, res) => {
  // covert params id string to number
  const roomId = Number(req.params.roomId);

  // check roomId is a positive number
  if (!isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // find room by roomId
  let room = findRoomById(roomId);

  // check roomId exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  const roomStatus = checkRoomRequirements(room, standardRoomRequirements);
  // respond with found room assets
  return res.status(200).json({
    message: "Room retrieved successfully",
    data: {
      id: room.id,
      number: room.number,
      assets: room.assets,
      isComplete: roomStatus.isComplete,
      damagedAssets: roomStatus.damagedAssets,
      missingAssets: roomStatus.missingAssets,
    },
  });
});

app.get("/rooms/:roomId/assets", (req, res) => {
  // covert params id string to number
  const roomId = Number(req.params.roomId);

  // check roomId is a positive number
  if (!isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // find room by roomId
  let room = findRoomById(roomId);

  // check roomId exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  // respond with found room assets
  return res.status(200).json({
    success: true,
    message: "Assets retrieved successfully",
    data: room.assets,
  });
});

app.patch("/rooms/:roomId/assets/:assetId", (req, res) => {
  const roomId = Number(req.params.roomId);
  const assetId = Number(req.params.assetId);

  // check roomId is a positive number
  if (!isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }
  // check assetId is a positive number
  if (!isValidId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  // find room by roomId
  let room = findRoomById(roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  const asset = findAssetById(room, assetId);

  // check asset exists
  if (asset === undefined) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  let condition = req.body.condition;

  // validate user input is a string and not empty
  if (typeof condition !== "string" || condition.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Asset condition is required",
    });
  }

  const trimmedCondition = condition.trim();

  // validate type is allowed
  const isValidCondition = allowedConditions.includes(trimmedCondition);

  if (!isValidCondition) {
    return res.status(400).json({
      success: false,
      message: "Asset condition not valid",
    });
  }

  const updatedAsset = updateAssetCondition(room, asset, trimmedCondition);

  // respond with status code 200 (Updated) and return the new item
  return res.status(200).json({
    success: true,
    message: "Asset updated successfully",
    data: updatedAsset,
  });
});

app.get("/rooms/:roomId/assets/:assetId", (req, res) => {
  const roomId = Number(req.params.roomId);
  const assetId = Number(req.params.assetId);

  // check roomId is a positive number
  if (!isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // check assetId is a positive number
  if (!isValidId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  // find room by roomId
  let room = findRoomById(roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  let asset = findAssetById(room, assetId);

  // check asset exists
  if (asset === undefined) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  // respond with status code 200 and return the asset
  return res.status(200).json({
    success: true,
    message: "Asset retrieved successfully",
    data: asset,
  });
});

app.delete("/rooms/:roomId/assets/:assetId", (req, res) => {
  const roomId = Number(req.params.roomId);
  const assetId = Number(req.params.assetId);

  // check roomId is a positive number
  if (!isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // check assetId is a positive number
  if (!isValidId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  // find room by roomId
  let room = findRoomById(roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  let deletedAsset = deleteAsset(room, assetId);

  // check asset exists
  if (deletedAsset === undefined) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  // respond with status code 200 and return the deleted asset
  return res.status(200).json({
    success: true,
    message: "Asset deleted successfully",
    data: deletedAsset,
  });
});
