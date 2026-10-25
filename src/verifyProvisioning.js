/**
 * Verifies RoomTrack startup data.
 */
export function verifyProvisioning(db) {
  const roomCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM rooms
  `).get().count;

  const assetCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM assets
  `).get().count;

  const userCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM users
  `).get().count;

  console.log(`
=================================
RoomTrack Startup Verification
=================================
Rooms : ${roomCount}
Assets: ${assetCount}
Users : ${userCount}
=================================
`);

  if (roomCount !== 74) {
    throw new Error(
      `Expected 74 rooms but found ${roomCount}`
    );
  }

  if (assetCount !== 888) {
    throw new Error(
      `Expected 888 assets but found ${assetCount}`
    );
  }

  console.log(
    "Provisioning verification passed"
  );
}