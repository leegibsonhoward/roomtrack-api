import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

const { app , db } = await import("../src/app.js");

let server;
let port;

before(() => {
  server = app.listen(0);

  const address = server.address();
  port = address.port;
});

after(() => {
  const dropTable = db.prepare('DROP TABLE IF EXISTS users');
  dropTable.run();
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