/**
 * Utility for reading a password from the terminal
 * without displaying typed characters.
 *
 * Used by user provisioning scripts to prevent
 * passwords from being exposed on screen.
 */
import { stdin, stdout } from "node:process";

export async function readPassword(prompt = "Password: ") {
  return new Promise((resolve) => {
    let password = "";

    stdout.write(prompt);

    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    const onData = (key) => {
      // Enter
      if (key === "\r" || key === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);

        stdout.write("\n");

        resolve(password);
        return;
      }

      // Ctrl+C
      if (key === "\u0003") {
        process.exit();
      }

      // Backspace
      if (key === "\u007f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write("\b \b");
        }
        return;
      }

      password += key;
      stdout.write("*");
    };

    stdin.on("data", onData);
  });
}