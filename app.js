import express from 'express';

const app = express();
const port = 3000;

const standardRoomRequirements = [
  { type: "phone", quantity: 1},
  { type: "tv", quantity: 1},
  { type: "microwave", quantity: 1 },
  { type: "refrigerator", quantity: 1 },
  { type: "coffee_pot", quantity: 1 },
  { type: "alarm_clock", quantity: 1 },
  { type: "shower_curtain", quantity: 1 },
  { type: "bed", quantity: 1 },
  { type: "chair", quantity: 1 },
  { type: "table", quantity: 1 },
  { type: "nightstand", quantity: 2 }
];

// memory database
let rooms = [
  {
    id: 1, number: "101", assets: [
    { id: 1, type: "tv"},
    { id: 2, type: "nightstand" },
    { id: 3, type: "nightstand" }
  ]
},
  {id: 2, number: "102", assets: [] }
];

// 
// Routes //////////////////////////////////////////
//
app.get('/', (req, res) => {
  res.json({
    status: "Ok",
    message: "Welcome to RoomTrack API",
    version: "v1.0.0"
  })
});

// list all rooms
app.get('/rooms', (req, res) => {
  res.json(rooms);
});

// create asset for room by ID
app.post('/rooms/:roomId/assets', (req, res) => {
  
  let room = rooms.find((room => room.id == req.params.roomId));
  console.log(room);

    const roomId = req.params.roomId;
    let assets = room.assets;

    // check if room id exists in database
    if (!roomId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Room is required' 
        });
    }

    // create a new asset object
    const newAsset = {
        id:  + 1, // generate a mock incremental ID
        name: "t.v"
    };

    // save the new asset into mock database
    assets.push(newAsset);

    console.log(assets);

    // respond with status code 201 (Created) and return the new item
    res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: newAsset
    });
});

app.get('/rooms/:roomId/assets', (req, res) => {

   // covert params id string to number
  const roomId = Number(req.params.roomId);

  // check roomId is a positive number
  if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({
          success: false,
          message: 'Invalid room ID'
      });
  }

  // find room by roomId
  let room = rooms.find((room => room.id === roomId));

  // check roomId exists
  if (room === undefined) {
    return res.status(404).json({
      success: false,
      message: 'Room not found'
    });
  }

  // business logic / requirements initial check
  standardRoomRequirements.forEach( requirement => {
    let matchedAssets = room.assets.filter(asset => asset.type === requirement.type);
    let actualQuantity = matchedAssets.length;
    console.log(`asset: ${requirement.type}, required: ${requirement.quantity}, actual: ${actualQuantity}`);
    console.log(actualQuantity);
    if (actualQuantity < requirement.quantity) {
      console.log("missing assets");
    }
});

  // respond with found room assets
  return res.status(200).json({
    message: "Assets retrieved successfully",
   // data: room.assets
  });

});

app.listen(port, () => {
  console.log(`RoomTrack API running on port ${port}`);
});