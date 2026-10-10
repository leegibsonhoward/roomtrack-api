import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

try {
  const username = (await rl.question("Username: ")).trim();
  const password = await rl.question("Password: ");
  
  const role = (
    await rl.question("Role (admin/staff): ")
  ).trim().toLowerCase();

  if (!username) {
    throw new Error("Username is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  if (!["admin", "staff"].includes(role)) {
    throw new Error("Role must be admin or staff");
  }

  console.log("\nUser details:");

  console.log({
    username,
    role,
  });

} catch (error) {
  console.error(`\nError: ${error.message}`);
} finally {
  rl.close();
}