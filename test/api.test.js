import test from "node:test";
import assert from "node:assert/strict";

process.env.DB_PATH = ":memory:";

const { app } = await import("../app.js");

test("GET /rooms returns seeded rooms", async () => {
  const server = app.listen(0);

  const address = server.address();
  const port = address.port;

  const response = await fetch(
    `http://localhost:${port}/rooms`
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.length, 3);

  assert.equal(body.data[0].number, 101);
  assert.equal(body.data[1].number, 102);
  assert.equal(body.data[2].number, 103);

  server.close();
});

test("asset CRUD lifecycle", async () => {
  const server = app.listen(0);

  const address = server.address();
  const port = address.port;

  // CREATE
  const createResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "chair",
      }),
    }
  );

  const createBody = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(createBody.success, true);
  assert.equal(createBody.data.type, "chair");
  assert.equal(createBody.data.condition, "good");

  // Save the ID SQLite generated
  const assetId = createBody.data.id;


  // READ
  const getResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`
  );

  const getBody = await getResponse.json();

  assert.equal(getResponse.status, 200);
  assert.equal(getBody.success, true);
  assert.equal(getBody.data.id, assetId);
  assert.equal(getBody.data.type, "chair");
  assert.equal(getBody.data.condition, "good");

  // UPDATE
  const patchResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        condition: "damaged",
      }),
    }
  );

  const patchBody = await patchResponse.json();

  assert.equal(patchResponse.status, 200);
  assert.equal(patchBody.success, true);
  assert.equal(patchBody.data.condition, "damaged");

  // READ AGAIN to prove update persisted
  const updatedResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`
  );

  const updatedBody = await updatedResponse.json();

  assert.equal(updatedResponse.status, 200);
  assert.equal(updatedBody.data.condition, "damaged");

  // DELETE
  const deleteResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`,
    {
      method: "DELETE",
    }
  );

  const deleteBody = await deleteResponse.json();

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteBody.success, true);

  // READ AGAIN to prove deletion persisted
  const deletedResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`
  );

  const deletedBody = await deletedResponse.json();

  assert.equal(deletedResponse.status, 404);
  assert.equal(deletedBody.success, false);

  server.close();
});