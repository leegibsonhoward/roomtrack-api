import bcrypt from 'bcrypt';
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("roomtrack.db");
import { initializeDatabase } from '../db/initializaDatabase.js';

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { readPassword } from "./readPassword.js";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

initializeDatabase(db);

async function createUser() {
try {
  const username = (await rl.question("Username: ")).trim();
  
  rl.close();

  const password = await readPassword();

  const role = (
    await readline
      .createInterface({
        input: stdin,
        output: stdout,
      })
      .question("Role (admin/staff): ")
  )
    .trim()
    .toLowerCase();

  if (!username) {
    throw new Error("Username is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  if (!["admin", "staff"].includes(role)) {
    throw new Error("Role must be admin or staff");
  }

  const passwordHash = await bcrypt.hash(
      password,
      12
  );
  
  const statement = db.prepare(`
  INSERT INTO users (
    username,
    password_hash,
    role
  )
  VALUES (?, ?, ?)
`);

try {
  statement.run(
    username,
    passwordHash,
    role
  );

  console.log("\nUser created successfully");

  console.log({
    username,
    role,
  });
} catch (error) {
  if (
    error.message.includes(
      "UNIQUE constraint failed: users.username"
    )
  ) {
    console.error(
      "\nError: Username already exists"
    );
  } else {
    throw error;
  }
}

} catch (error) {
  console.error(`\nError: ${error.message}`);
} finally {
    db.close();
    process.exit(0); // Temporary workaround on hang
  }
}

createUser();