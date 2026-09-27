import express from "express";
import { DatabaseSync } from "node:sqlite";

const app = express();
const port = 3000;

const db = new DatabaseSync("roomtrack.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY,
  number INTEGER NOT NULL
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

app.use(express.json());

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

// memory database
let rooms = [
  {
    id: 1,
    number: "101",
    assets: [
      { id: 1, type: "phone", condition: "good" },
      { id: 2, type: "tv", condition: "good" },
      { id: 3, type: "microwave", condition: "good" },
      { id: 4, type: "refrigerator", condition: "good" },
      { id: 5, type: "coffee_pot", condition: "good" },
      { id: 6, type: "alarm_clock", condition: "good" },
      { id: 7, type: "shower_curtain", condition: "good" },
      { id: 8, type: "bed", condition: "good" },
      { id: 9, type: "chair", condition: "good" },
      { id: 10, type: "table", condition: "good" },
      { id: 11, type: "nightstand", condition: "good" },
      { id: 12, type: "nightstand", condition: "good" },
    ],
  },
  { id: 2, number: "102", assets: [] },
];

//
// Helpers
//

// SQLite migration helpers 
function findRoomById(roomId) {
  const statement = db.prepare(
  "SELECT * FROM rooms WHERE id = ?"
);

  const room = statement.get(roomId);

  if (room === undefined) {
    return undefined;
  }

  const assets = findAssetsByRoomId(roomId);

  room.assets = assets;

  return room;
}

function findAssetsByRoomId(roomId) {
  const statement = db.prepare(
    "SELECT * FROM assets WHERE room_id = ?"
  );

  return statement.all(roomId);
}
// check if id is a valid number
function isValidId(id) {
  return Number.isInteger(id) || id >= 0;
}

function findAssetById(room, assetId) {
  const statement = db.prepare(
    "SELECT * FROM assets WHERE id = ? AND room_id = ?"
  );

  return statement.get(assetId, room.id);
}

function deleteAsset(room, assetId) {
  let index = room.assets.findIndex(asset => asset.id === assetId);

  if (index === -1) {
    return undefined;
  }

  let deletedAsset = room.assets.splice(index, 1);

  return deletedAsset[0]; // returns object not an array
}

function createAsset(room, trimmedAssetType) {
  const statement = db.prepare(`
    INSERT INTO assets (room_id, type, condition)
    VALUES (?, ?, ?)  
  `);

  const result = statement.run(
    room.id,
    trimmedAssetType,
    "good"
  );
  
  const newAsset = findAssetById(
    room,
    result.lastInsertRowid
  );

  return newAsset;

}

function updateAssetCondition(asset, condition) {
  asset.condition = condition;
  return asset;
}

//
// Routes //////////////////////////////////////////
//
app.get("/", (req, res) => {
  res.json({
    status: "Ok",
    message: "Welcome to RoomTrack API",
    version: "v1.0.0",
  });
});

// list all rooms
app.get("/rooms", (req, res) => {
  res.json(rooms);
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

  console.log(room);

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
  res.status(201).json({
    success: true,
    message: "Asset created successfully",
    data: newAsset,
  });
});

function checkRoomRequirements(room, standardRoomRequirements) {
  // business logic / requirements initial check
  let damagedAssets = [];
  let missingAssets = [];
  standardRoomRequirements.forEach(requirement => {
    let matchedAssets = room.assets.filter(
      asset => asset.type === requirement.type,
    );

    let damagedMatches = matchedAssets.filter(
      asset => asset.condition === "damaged",
    );

    let actualQuantity = matchedAssets.length;

    //console.log(requirement.type, damagedMatches);
    damagedAssets.push(...damagedMatches);

    if (actualQuantity < requirement.quantity) {
      missingAssets.push({
        type: requirement.type,
        required: requirement.quantity,
        actual: actualQuantity,
        missing: requirement.quantity - actualQuantity,
      });
    }
  });

  const isComplete = missingAssets.length === 0 && damagedAssets.length === 0;
  return {
    missingAssets: missingAssets,
    damagedAssets: damagedAssets,
    isComplete: isComplete,
  };
}

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

  const inventoryStatus = checkRoomRequirements(room, standardRoomRequirements);
  console.log(inventoryStatus);

  // respond with found room assets
  return res.status(200).json({
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

  const updatedAsset = updateAssetCondition(asset, trimmedCondition);

  // respond with status code 200 (Updated) and return the new item
  res.status(200).json({
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
  res.status(200).json({
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
  res.status(200).json({
    success: true,
    message: "Asset deleted successfully",
    data: deletedAsset,
  });
});

app.listen(port, () => {
  console.log(`RoomTrack API running on port ${port}`);
});
