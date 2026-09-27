export function checkRoomRequirements(room, standardRoomRequirements) {
  // business logic / requirements initial check
  let damagedAssets = [];
  let missingAssets = [];
  standardRoomRequirements.forEach(requirement => {
    let matchedAssets = room.assets.filter(
      asset => asset.type === requirement.type,
    );

    let damagedMatches = matchedAssets.filter(
      asset => asset.condition === "damaged",
    );

    let actualQuantity = matchedAssets.length;

    //console.log(requirement.type, damagedMatches);
    damagedAssets.push(...damagedMatches);

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