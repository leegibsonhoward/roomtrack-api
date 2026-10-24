import { provisionRoomAssets } from './provisionRoomAssets.js';

import {
  generateRooms,
  productionRoomRanges,
} from "./generateRooms.js";

/**
 * Provisions all production rooms defined by
 * productionRoomRanges.
 *
 * Safe to run multiple times.
 *
 * Newly provisioned rooms automatically receive
 * their standard asset inventory.
 */
export function provisionRooms(db) {
  const rooms = generateRooms(productionRoomRanges);

  const statement = db.prepare(`
    INSERT OR IGNORE INTO rooms (number)
    VALUES (?)
  `);
  
  // Create production rooms before provisioning
  // their standard asset inventory.
  rooms.forEach((room) => {
    statement.run(room.number);
  });

  provisionRoomAssets(db);
  
}