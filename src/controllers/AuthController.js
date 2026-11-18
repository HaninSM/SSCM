const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
      }

      const user = await db('users').where({ username, is_active: true }).first();
      if (!user) {
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'sscm_super_secret_jwt_key_2026_tokojendral_style',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await db('users').where({ id: req.user.id }).select('id', 'username', 'name', 'role', 'created_at').first();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
