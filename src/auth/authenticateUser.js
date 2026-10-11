import bcrypt from "bcrypt";

export async function authenticateUser(
  db,
  username,
  password
) {
  const user = db
    .prepare(`
      SELECT
        id,
        username,
        password_hash,
        role,
        active
      FROM users
      WHERE username = ?
    `)
    .get(username);

  if (!user) {
    return {
      success: false,
    };
  }

  if (!user.active) {
    return {
      success: false,
    };
  }

  const isValidPassword = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isValidPassword) {
    return {
      success: false,
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}
