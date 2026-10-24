/**
 * Defines the production room inventory.
 *
 * Each range represents a contiguous block of room
 * numbers that should exist in the system after
 * provisioning.
 */
export const productionRoomRanges = [
  {
    start: 101,
    end: 114,
    exclude: [113],
  },
  {
    start: 201,
    end: 214,
    exclude: [213],
  },
  {
    start: 605,
    end: 655,
    exclude: [612, 613, 616],
  },
];

/**
 * Generates room records from a collection of room
 * number ranges.
 *
 * Used during room provisioning to create the complete
 * set of production rooms managed by RoomTrack.
 */
export function generateRooms(roomRanges) {
  const rooms = [];

  // Expand room ranges into individual room
  // records used for provisioning.
  for (const range of roomRanges) {
    for (let roomNumber = range.start; roomNumber <= range.end; roomNumber++) {
      if (range.exclude.includes(roomNumber)) {
        continue;
      }

      rooms.push({
        number: roomNumber,
      });
    }
  }

  return rooms;
}
