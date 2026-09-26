import express from "express";

const app = express();
const port = 3000;

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
// check if id is a valid number
function isValidId(id) {
  return (!Number.isInteger(id) || id <= 0);
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

  let room = rooms.find((room) => room.id === roomId);
  console.log(room);

  let assets = room.assets;

  // check if room id exists in database
  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: "Room is required",
    });
  }

  // flatten all assets across rooms
  const flatAssets = rooms.flatMap(room => room.assets);
  // extract asset ids
  const allIds = flatAssets.map(asset => asset.id);

  // find highest asset id
  let highestId;
  if(allIds.length === 0) {
    highestId = 0;
  } else {
    highestId = Math.max(...allIds);
  }

  const assetType = req.body.type;

  // validate user input is a string and not empty
  if ( typeof assetType !== "string" ||
    assetType.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Asset type is required"
      });
  }

  const trimmedAssetType = assetType.trim();

  // validate type is allowed
  const foundRequirement = standardRoomRequirements.find(requirement => requirement.type === trimmedAssetType);

  if (foundRequirement === undefined) {
    return res.status(400).json({
        success: false,
        message: "Asset type not valid"
      });
  }

  // create a new asset object
  const newAsset = {
    id: highestId + 1, // incremental Id
    type: trimmedAssetType,
    condition: "good"
  };

  // save the new asset into mock database
  assets.push(newAsset);

  console.log(assets);

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
  standardRoomRequirements.forEach((requirement) => {
    let matchedAssets = room.assets.filter(
      asset => asset.type === requirement.type);

    let damagedMatches = matchedAssets.filter(
      asset => asset.condition === "damaged");

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
  if (isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // find room by roomId
  let room = rooms.find((room) => room.id === roomId);

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
      missingAssets: roomStatus.missingAssets
    }
  });
});

app.get("/rooms/:roomId/assets", (req, res) => {
  // covert params id string to number
  const roomId = Number(req.params.roomId);

  // check roomId is a positive number
  if (isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // find room by roomId
  let room = rooms.find((room) => room.id === roomId);

  // check roomId exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  const inventoryStatus = checkRoomRequirements(
    room,
    standardRoomRequirements,
  );
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
  if (isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }
// check assetId is a positive number
  if (isValidId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  // find room by roomId
  let room = rooms.find((room) => room.id === roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }
  let updatedAsset = room.assets.find(asset => asset.id === assetId);

  // check asset exists
  if (updatedAsset === undefined) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  let condition = req.body.condition;

  // validate user input is a string and not empty
  if ( typeof condition !== "string" ||
    condition.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Asset condition is required"
      });
  }

  const trimmedCondition = condition.trim();

  // validate type is allowed
  const isValidCondition = allowedConditions.includes(trimmedCondition);

if (!isValidCondition) {
  return res.status(400).json({
    success: false,
    message: "Asset condition not valid"
  });
}
  updatedAsset.condition = trimmedCondition;

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
  if (isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }

  // check assetId is a positive number
  if (isValidId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  // find room by roomId
  let room = rooms.find((room) => room.id === roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  let asset = room.assets.find(asset => asset.id === assetId);

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
  if (isValidId(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }
  
  // check assetId is a positive number
  if (isValidId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  // find room by roomId
  let room = rooms.find((room) => room.id === roomId);

  // check room exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  let index = room.assets.findIndex(asset => asset.id === assetId);

  // check asset exists
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  let deletedAsset = room.assets.splice(index, 1);
  
  // respond with status code 200 and return the deleted asset
  res.status(200).json({
    success: true,
    message: "Asset deleted successfully",
    data: deletedAsset[0], // return object not an array
  });

});

app.listen(port, () => {
  console.log(`RoomTrack API running on port ${port}`);
});
