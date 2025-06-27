export const checkAdmin = (req, res, next) => {
  const user = req.user;

  if (!user || !["admin", "super_admin"].includes(user.power)) {
    return res.status(403).json({
      message: "Access denied: only admins can perform this action.",
    });
  }

  next(); // ✅ allowed to proceed
};
