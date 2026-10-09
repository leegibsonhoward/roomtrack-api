import {
  generateRooms,
  productionRoomRanges,
} from "./generateRooms.js";

export function provisionRooms(db) {
  const rooms = generateRooms(productionRoomRanges);

  const statement = db.prepare(`
    INSERT OR IGNORE INTO rooms (number)
    VALUES (?)
  `);

  rooms.forEach((room) => {
    statement.run(room.number);
  });
}