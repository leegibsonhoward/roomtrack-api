import test from "node:test";
import assert from "node:assert/strict";

import { checkRoomRequirements } from "../src/checkRoomRequirements.js";

test("room is complete when all required assets are good", () => {

  const room = {
    assets: [
      // test assets
      { id: 1, type: "bed", condition: "good" },
      { id: 2, type: "chair", condition: "good" }
    ]
  };

  const requirements = [
    // set of requirements for tests
    { type: "bed", quantity: 1 },
    { type: "chair", quantity: 1 }
  ];

  const result = checkRoomRequirements(room, requirements);

  assert.equal(result.isComplete, true);
});

test("room is incomplete when a required asset is missing", () => {

  const room = {
    assets: [
      // test assets
      { id: 1, type: "chair", condition: "damaged" },
    ]
  };

  const requirements = [
    // set of requirements for tests
    { type: "bed", quantity: 1 },

  ];

  const result = checkRoomRequirements(room, requirements);

  assert.equal(result.isComplete, false);
  assert.equal(result.missingAssets.length, 1);
  assert.equal(result.missingAssets[0].type, "bed");
  assert.equal(result.missingAssets[0].missing, 1);  

});

test("room is incomplete when a required asset is damaged", () => {
const room = {
    assets: [
      // test assets
      { id: 1, type: "bed", condition: "damaged" },
    ]
  };

  const requirements = [
    // set of requirements for tests
    { type: "bed", quantity: 1 },
  ];

  const result = checkRoomRequirements(room, requirements);

  assert.equal(result.isComplete, false);
  assert.equal(result.damagedAssets.length, 1);
  assert.equal(result.damagedAssets[0].type, "bed");
  assert.equal(result.damagedAssets[0].condition, "damaged");
});

test("reports correct missing quantity", () => {
const room = {
    assets: [
      // test assets
      { id: 1, type: "nightstand", condition: "good" },
    ]
  };

  const requirements = [
    // set of requirements for tests
    { type: "nightstand", quantity: 2 },
  ];

  const result = checkRoomRequirements(room, requirements);

  assert.equal(result.isComplete, false);
  assert.equal(result.missingAssets[0].type, "nightstand");
  assert.equal(result.missingAssets[0].required, 2);
  assert.equal(result.missingAssets[0].actual, 1);
  assert.equal(result.missingAssets[0].missing, 1); 
});