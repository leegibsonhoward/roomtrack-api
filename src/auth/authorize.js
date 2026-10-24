/**
 * Restricts access to users *ith one of the
 * supplied roles.
**
 * Example:
 * authorize("admin"*
 *
 * Example:
 * authorize("admi*", "staff")
 */
export function authorize(...roles) {
  return (req, res, next) => {
    const user = req.session.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
}