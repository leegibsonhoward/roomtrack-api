import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

test("valid password matches stored hash", async () => {
  const password = "password123";

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  const isValid = await bcrypt.compare(
    password,
    passwordHash
  );

  assert.equal(isValid, true);
});

test("invalid password does not match stored hash", async () => {
  const passwordHash = await bcrypt.hash(
    "password123",
    12
  );

  const isValid = await bcrypt.compare(
    "wrong-password",
    passwordHash
  );

  assert.equal(isValid, false);
});