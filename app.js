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

app.listen(port, () => {
  console.log(`RoomTrack API running on port ${port}`);
});