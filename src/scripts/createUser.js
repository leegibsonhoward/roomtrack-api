import bcrypt from 'bcrypt';

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { readPassword } from "./readPassword.js";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

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
  //rl.close();

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
  
  console.log("\nUser details:");

  console.log({
    username,
    role,
  });

} catch (error) {
  console.error(`\nError: ${error.message}`);
} finally {
    process.exit(0); // Temporary workaround on hang
  }
}

createUser();