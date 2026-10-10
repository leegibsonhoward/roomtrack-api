import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

test("hashes and verifies passwords", async () => {
  const password = "password";

  const hash = await bcrypt.hash(password, 12);

  assert.notEqual(hash, password);

  const isValid = await bcrypt.compare(
    password,
    hash
  );

  assert.equal(isValid, true);
});