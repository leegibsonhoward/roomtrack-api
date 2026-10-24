/**
 * Evaluates a room against the standard inventory
 * requirements defined for RoomTrack.
 *
 * Determines whether a room is complete and identifies
 * assets that are missing or marked as damaged.
 *
 * Used by room inspection and compliance reporting.
 */
export function checkRoomRequirements(room, standardRoomRequirements) {
  // business logic / requirements initial check
  let damagedAssets = [];
  let missingAssets = [];

  // Compare the room's current inventory against
  // the expected inventory requirements.
  standardRoomRequirements.forEach(requirement => {
    let matchedAssets = room.assets.filter(
      asset => asset.type === requirement.type,
    );

    // Assets marked as damaged reduce room
    // compliance even when they exist.
    let damagedMatches = matchedAssets.filter(
      asset => asset.condition === "damaged",
    );

    let actualQuantity = matchedAssets.length;

    damagedAssets.push(...damagedMatches);

    // Record unmet inventory requirements so they
    // can be reported in inspection results.
    if (actualQuantity < requirement.quantity) {
      missingAssets.push({
        type: requirement.type,
        required: requirement.quantity,
        actual: actualQuantity,
        missing: requirement.quantity - actualQuantity,
      });
    }
  });

  const isComplete = missingAssets.length === 0 && damagedAssets.length === 0;
  return {
    missingAssets: missingAssets,
    damagedAssets: damagedAssets,
    isComplete: isComplete,
  };
}