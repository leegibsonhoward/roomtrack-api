//
// Imports
//

// Environment
import "dotenv/config";

// Third-party packages
import express from "express";
import session from 'express-session';
import helmet from "helmet";

// Node.js
import { DatabaseSync } from "node:sqlite";

// Authentication
import { authenticate } from "./auth/authenticate.js";
import { authenticateUser } from "./auth/authenticateUser.js";
import { authorize } from './auth/authorize.js';

// Database
import { initializeDatabase } from './db/initializaDatabase.js';
import { ensureBootstrapAdmin } from "./ensureBootstrapAdmin.js";

// Provisioning
import { provisionRooms } from "./provisionRooms.js";
import { verifyProvisioning } from "./verifyProvisioning.js";

// RoomTrack modules
import { checkRoomRequirements } from "./checkRoomRequirements.js";
import { standardRoomRequirements } from "./standardRoomRequirements.js";

//
// Configuration
//
export const app = express();

// limit payload size
app.use(express.json({
    limit: "100kb",
  }));

app.use(helmet());

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required"
  );
}

// express-session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
  })
);

//
// Database Initialization
//
const databasePath = process.env.DB_PATH || "roomtrack.db";

export const db = new DatabaseSync(databasePath);
// TODO: should db be exported for tests.
// tests import db from app.js and set databasePath to
// process.env.DB_PATH = ":memory:"

initializeDatabase(db);

provisionRooms(db);

// added for production.
ensureBootstrapAdmin(db);
verifyProvisioning(db);

//
// Database Helpers
//

/**
 * Validates route identifiers before they are used
 * in database queries.
 *
 * Prevents invalid room and asset identifiers from
 * reaching the data access layer.
 */
function isValidId(id) {
  return Number.isInteger(id) || id >= 0;
}

/**
 * Creates a new asset in the supplied room and
 * returns the newly created database record.
 */
function createAsset(room, trimmedAssetType) {
  const statement = db.prepare(`
    INSERT INTO assets (room_id, type, condition)
    VALUES (?, ?, ?)  
  `);

  const result = statement.run(room.id, trimmedAssetType, "good");

  // Re-read the inserted asset so callers receive
  // the stored database representation.
  const newAsset = findAssetById(room, result.lastInsertRowid);

  return newAsset;
}

// READ 
function findAllRooms() {
  const statement = db.prepare(`SELECT * FROM rooms`);
  return statement.all();
}

/**
 * Retrieves a room and eagerly loads its assets.
 *
 * Returns undefined when the room does not exist.
 */
function findRoomById(roomId) {
  const statement = db.prepare("SELECT * FROM rooms WHERE id = ?");

  const room = statement.get(roomId);

  if (room === undefined) {
    return undefined;
  }

  // Attach room assets so route handlers receive
  // a complete room representation.
  const assets = findAssetsByRoomId(roomId);

  room.assets = assets;

  return room;
}

/**
 * Retrieves every asset assigned to a room.
 */
function findAssetsByRoomId(roomId) {
  const statement = db.prepare("SELECT * FROM assets WHERE room_id = ?");

  return statement.all(roomId);
}

/**
 * Retrieves a specific asset belonging to a room.
 *
 * Asset ownership is verified using both the room
 * identifier and asset identifier.
 */
function findAssetById(room, assetId) {
  const statement = db.prepare(
    "SELECT * FROM assets WHERE id = ? AND room_id = ?",
  );

  return statement.get(assetId, room.id);
}

/**
 * Updates an asset's condition and returns the
 * latest database record.
 */
function updateAssetCondition(room, asset, condition) {
  const statement = db.prepare(`
    UPDATE assets
    SET condition = ?
    WHERE id = ? AND room_id = ?
  `);

  statement.run(condition, asset.id, room.id);

  return findAssetById(room, asset.id);
}

/**
 * Deletes an asset from a room and returns the
 * deleted asset information.
 *
 * returning the deleted record allows route
 * handlers to include it in API responses.
 */
function deleteAsset(room, assetId) {

  // Capture the asset before deletion so it can
  // be returned to the caller.
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
// Health Routes
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

//
// Authentication Routes
//
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  const result = await authenticateUser(
    db,
    username,
    password
  );

  if (!result.success) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
  req.session.user = result.user;
  return res.status(200).json({
    success: true,
    data: result.user,
  });
});

app.get("/auth/me", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.session.user,
  });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to logout",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

//
// Room & Asset Routes
//
app.get("/rooms", authenticate, (req, res) => {
  const rooms = findAllRooms();

  return res.status(200).json({
    success: true,
    message: "Room(s) retrieved successfully",
    data: rooms,
  });
});

// create asset for room by ID
app.post("/rooms/:roomId/assets", authenticate, (req, res) => {
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

app.get("/rooms/:roomId", authenticate, (req, res) => {
  // convert params id string to number
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
    success: true,
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

app.get("/rooms/:roomId/assets", authenticate, (req, res) => {
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

app.patch("/rooms/:roomId/assets/:assetId", authenticate, (req, res) => {
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

  const allowedConditions = ["good", "damaged"];

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

app.get("/rooms/:roomId/assets/:assetId", authenticate, (req, res) => {
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

app.delete("/rooms/:roomId/assets/:assetId", authenticate, authorize("admin"), (req, res) => {
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
