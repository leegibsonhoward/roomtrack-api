/**
 * Ensures an authenticated user exists in the
 * current session before allowing access to a
 * protected route.
 *
 * Returns HTTP 401 when authentication is
 * required.
 */
export function authenticate(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  next();
}
