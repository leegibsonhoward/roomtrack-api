import bcrypt from "bcrypt";

/**
 * Creates the first administrator account
 * from environment variables when no
 * administrator exists.
 */
export function ensureBootstrapAdmin(db) {
  const adminExists = db.prepare(`
    SELECT 1
    FROM users
    WHERE role = ?
    LIMIT 1
  `).get("admin");

  if (adminExists) {
    console.log(
      "Bootstrap admin already exists"
    );
    return;
  }

  const username =
    process.env.ADMIN_USERNAME;

  const password =
    process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.log(
      "Bootstrap admin skipped: missing credentials"
    );
    return;
  }

  const passwordHash =
    bcrypt.hashSync(
      password,
      12
    );

  db.prepare(`
    INSERT INTO users (
      username,
      password_hash,
      role
    )
    VALUES (?, ?, ?)
  `).run(
    username,
    passwordHash,
    "admin"
  );

  console.log(
    `Bootstrap admin created: ${username}`
  );
}