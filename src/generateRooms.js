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

export function generateRooms(roomRanges) {
  const rooms = [];

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
