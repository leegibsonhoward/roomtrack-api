import { standardRoomRequirements } from "./standardRoomRequirements.js";

export function provisionRoomAssets(db) {
  const rooms = db.prepare(`
    SELECT id
    FROM rooms
  `).all();

  const countAssets = db.prepare(`
    SELECT COUNT(*) AS count
    FROM assets
    WHERE room_id = ?
      AND type = ?
  `);

  const insertAsset = db.prepare(`
    INSERT INTO assets (
      room_id,
      type,
      condition
    )
    VALUES (?, ?, ?)
  `);

  for (const room of rooms) {
    for (const requirement of standardRoomRequirements) {
      const result = countAssets.get(
        room.id,
        requirement.type
      );

      const missing =
        requirement.quantity - result.count;

      for (let i = 0; i < missing; i++) {
        insertAsset.run(
          room.id,
          requirement.type,
          "good"
        );
      }
    }
  }
}