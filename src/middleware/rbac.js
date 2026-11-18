function rbacMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Anda membutuhkan hak akses [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = rbacMiddleware;
