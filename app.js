import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({
    status: "Ok",
    message: "Welcome to RoomTrack API",
    version: "v1.0.0"
  })
});

app.get('/rooms', (req, res) => {
  res.json([
    {id: 1, number: "101"},
    {id: 2, number: "102"}
  ])
});

app.listen(port, () => {
  console.log(`RoomTrack API running on port ${port}`);
});