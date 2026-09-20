import express from 'express';

const app = express();
const port = 3000;

// memory database
let rooms = [
  {id: 1, number: "101", assets: [] },
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
  
  let result = rooms.find((room => room.id == req.params.roomId));
  console.log(result);

    const roomId = req.params.roomId;
    let assets = result.assets;

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

app.listen(port, () => {
  console.log(`RoomTrack API running on port ${port}`);
});