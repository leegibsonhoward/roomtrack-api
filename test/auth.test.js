import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

process.env.DB_PATH = ":memory:";

process.env.SESSION_SECRET = "test-session-secret";

const { app , db } = await import("../src/app.js");

let server;
let port;

beforeEach(()=>{
  db.exec(`
    DELETE FROM users;
  `);
});

before(() => {
  server = app.listen(0);

  const address = server.address();
  port = address.port;
});

after(() => {
  server.close();
});


async function createUser(
  username,
  password,
  role = "admin",
  active = 1
) {
  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  db.prepare(`
    INSERT INTO users (
      username,
      password_hash,
      role,
      active
    )
    VALUES (?, ?, ?, ?)
  `).run(
    username,
    passwordHash,
    role,
    active
  );
}

test("POST /auth/login authenticates valid user", async () => {
  await createUser(
    "lee",
    "password123"
  );

  const response = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "lee",
        password: "password123",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);

  assert.equal(body.data.username, "lee");
  assert.equal(body.data.role, "admin");
});

test("POST /auth/login rejects unknown user", async () => {
  const response = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "missing-user",
        password: "password123",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Invalid credentials"
  );
});

test("POST /auth/login rejects invalid password", async () => {
  await createUser(
    "password-test-user",
    "password123"
  );

  const response = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "password-test-user",
        password: "wrong-password",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Invalid credentials"
  );
});

test("POST /auth/login rejects inactive user", async () => {
  await createUser(
    "inactive-user",
    "password123",
    "admin",
    0
  );

  const response = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "inactive-user",
        password: "password123",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Invalid credentials"
  );
});

test("POST /auth/login requires username", async () => {
  const response = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "password123",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);

  assert.equal(
    body.message,
    "Username is required"
  );
});

test("POST /auth/login requires password", async () => {
  const response = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "lee",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);

  assert.equal(
    body.message,
    "Password is required"
  );
});

test("GET /auth/me requires authentication", async () => {
  const response = await fetch(
    `http://localhost:${port}/auth/me`
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("GET /auth/me returns current user", async () => {
  await createUser(
    "me-user",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "me-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const response = await fetch(
    `http://localhost:${port}/auth/me`,
    {
      headers: {
        Cookie: cookie,
      },
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);

  assert.equal(
    body.data.username,
    "me-user"
  );

  assert.equal(
    body.data.role,
    "admin"
  );
});

test("POST /auth/logout destroys session", async () => {
  await createUser(
    "logout-user",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "logout-user",
        password: "password123",
      }),
    }
  );

  const cookie = loginResponse.headers.get("set-cookie");

  const logoutResponse = await fetch(
    `http://localhost:${port}/auth/logout`,
    {
      method: "POST",
      headers: {
        Cookie: cookie,
      },
    }
  );

  const logoutBody = await logoutResponse.json();

  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutBody.success, true);
});

test("POST /auth/logout removes authentication", async () => {
  await createUser(
    "logged-out-user",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "logged-out-user",
        password: "password123",
      }),
    }
  );

  const cookie = loginResponse.headers.get("set-cookie");

  await fetch(
    `http://localhost:${port}/auth/logout`,
    {
      method: "POST",
      headers: {
        Cookie: cookie,
      },
    }
  );

  const meResponse = await fetch(
    `http://localhost:${port}/auth/me`,
    {
      headers: {
        Cookie: cookie,
      },
    }
  );

  const meBody = await meResponse.json();

  assert.equal(meResponse.status, 401);
  assert.equal(meBody.success, false);
  assert.equal(
    meBody.message,
    "Authentication required"
  );
});

test("POST /auth/logout succeeds when already logged out", async () => {
  const response = await fetch(
    `http://localhost:${port}/auth/logout`,
    {
      method: "POST",
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test("GET /rooms requires authentication", async () => {
  const response = await fetch(
    `http://localhost:${port}/rooms`
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("GET /rooms allows authenticated users", async () => {
  await createUser(
    "rooms-user",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "rooms-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const response = await fetch(
    `http://localhost:${port}/rooms`,
    {
      headers: {
        Cookie: cookie,
      },
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.length > 0);
});

test("GET /rooms/:roomId requires authentication", async () => {
  const response = await fetch(
    `http://localhost:${port}/rooms/1`
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("GET /rooms/:roomId allows authenticated users", async () => {
  await createUser(
    "room-detail-user",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "room-detail-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const response = await fetch(
    `http://localhost:${port}/rooms/1`,
    {
      headers: {
        Cookie: cookie,
      },
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test("GET /rooms/:roomId/assets requires authentication", async () => {
  const response = await fetch(
    `http://localhost:${port}/rooms/1/assets`
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("GET /rooms/:roomId/assets allows authenticated users", async () => {
  await createUser(
    "assets-user",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "assets-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const response = await fetch(
    `http://localhost:${port}/rooms/1/assets`,
    {
      headers: {
        Cookie: cookie,
      },
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test(
  "GET /rooms/:roomId/assets/:assetId requires authentication",
  async () => {
    const response = await fetch(
      `http://localhost:${port}/rooms/1/assets/1`
    );

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "Authentication required"
    );
  }
);

test(
  "GET /rooms/:roomId/assets/:assetId allows authenticated users",
  async () => {
    await createUser(
      "asset-detail-user",
      "password123",
    );

    const loginResponse = await fetch(
      `http://localhost:${port}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "asset-detail-user",
          password: "password123",
        }),
      }
    );

    const cookie =
      loginResponse.headers.get("set-cookie");

    const createResponse = await fetch(
      `http://localhost:${port}/rooms/1/assets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          type: "chair",
        }),
      }
    );

    const createBody =
      await createResponse.json();

    const assetId = createBody.data.id;

    const response = await fetch(
      `http://localhost:${port}/rooms/1/assets/${assetId}`,
      {
        headers: {
          Cookie: cookie,
        },
      }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(
      body.data.id,
      assetId
    );
  }
);


test("POST /rooms/:roomsId/assets requires authentication", async () => {


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
  const body = await createResponse.json();

  assert.equal(createResponse.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("POST /rooms/:roomsId/assets allows authenticated user", async () => {
  await createUser(
    "create-assets-user2",
    "password123",
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "create-assets-user2",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const response = await fetch(
    `http://localhost:${port}/rooms`,
    {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.length > 0);
});

test("PATCH /rooms/:roomId/assets/:assetId requires authentication", async () => {
  const response = await fetch(
    `http://localhost:${port}/rooms/1/assets/1`,
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

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("DELETE /rooms/:roomId/assets/:assetId requires authentication", async () => {
  const response = await fetch(
    `http://localhost:${port}/rooms/1/assets/1`,
    {
      method: "DELETE",
    }
  );

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Authentication required"
  );
});

test("staff cannot delete assets", async () => {
  await createUser(
    "staff-user",
    "password123",
    "staff"
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "staff-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const createResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        type: "chair",
      }),
    }
  );

  const createBody =
    await createResponse.json();

  const assetId = createBody.data.id;

  const deleteResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`,
    {
      method: "DELETE",
      headers: {
        Cookie: cookie,
      },
    }
  );

  const deleteBody =
    await deleteResponse.json();

  assert.equal(deleteResponse.status, 403);
  assert.equal(deleteBody.success, false);
  assert.equal(
    deleteBody.message,
    "Forbidden"
  );
});

test("admin can delete assets", async () => {
  await createUser(
    "admin-user",
    "password123",
    "admin"
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const createResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        type: "chair",
      }),
    }
  );

  const createBody =
    await createResponse.json();

  const assetId = createBody.data.id;

  const deleteResponse = await fetch(
    `http://localhost:${port}/rooms/1/assets/${assetId}`,
    {
      method: "DELETE",
      headers: {
        Cookie: cookie,
      },
    }
  );

  const deleteBody =
    await deleteResponse.json();

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteBody.success, true);
});

test("user without required role receives forbidden response", async () => {
  await createUser(
    "staff-role-user",
    "password123",
    "staff"
  );

  const loginResponse = await fetch(
    `http://localhost:${port}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "staff-role-user",
        password: "password123",
      }),
    }
  );

  const cookie =
    loginResponse.headers.get("set-cookie");

  const response = await fetch(
    `http://localhost:${port}/rooms/1/assets/1`,
    {
      method: "DELETE",
      headers: {
        Cookie: cookie,
      },
    }
  );

  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Forbidden"
  );
  
});