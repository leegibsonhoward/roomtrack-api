/**
 * Defines the standard inventory expected in every
 * provisioned room.
 *
 * Room provisioning uses these requirements to seed
 * assets and room inspections use them to determine
 * compliance.
 *
 * Each requirement specifies:
 * - asset type
 * - expected quantity
 */
export const standardRoomRequirements = [
  { type: "phone", quantity: 1 },
  { type: "tv", quantity: 1 },
  { type: "microwave", quantity: 1 },
  { type: "refrigerator", quantity: 1 },
  { type: "coffee_pot", quantity: 1 },
  { type: "alarm_clock", quantity: 1 },
  { type: "shower_curtain", quantity: 1 },
  { type: "bed", quantity: 1 },
  { type: "chair", quantity: 1 },
  { type: "table", quantity: 1 },
  { type: "nightstand", quantity: 2 },
];
