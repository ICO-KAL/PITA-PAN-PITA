const AuthService = require('../services/auth.service');

class AuthController {
  async register(req, res) {
    try {
      const { nombre, email, password, contrasena } = req.body;
      // accept both 'password' or 'contrasena' from frontend
      const pass = password || contrasena;
      const result = await AuthService.register({ nombre, email, contrasena: pass });
      res.status(201).json({ token: result.token, user: result.user });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password, contrasena } = req.body;
      const pass = password || contrasena;
      const result = await AuthService.login({ email, contrasena: pass });
      res.json({ token: result.token, user: result.user });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async registerEmployee(req, res) {
    try {
      const { nombre, email, password, contrasena, roleName } = req.body;
      const pass = password || contrasena;
      const result = await AuthService.registerWithRole({ nombre, email, contrasena: pass, roleName });
      res.status(201).json({ token: result.token, user: result.user });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new AuthController();
