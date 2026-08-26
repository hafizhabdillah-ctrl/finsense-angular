const express = require('express');
console.log('[Debug authRoutes] 1. express loaded');

const router = express.Router();

const authController = require('../controllers/authController');
console.log('[Debug authRoutes] 2. authController loaded');

const {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateRefreshToken,
  validateLogout,
} = require('../utils/validation');
console.log('[Debug authRoutes] 3. validation loaded');

const validate = require('../middleware/validate');
console.log('[Debug authRoutes] 4. validate loaded');

const auth = require('../middleware/auth');
console.log('[Debug authRoutes] 5. auth middleware loaded');

router.post('/register', validate(validateRegister), authController.register);
router.post('/login', validate(validateLogin), authController.login);
router.put(
  '/profile',
  auth,
  validate(validateUpdateUser),
  authController.updateProfile,
);
router.get('/profile', auth, authController.getProfile);
router.post(
  '/refresh-token',
  validate(validateRefreshToken),
  authController.refreshToken,
);
router.post('/logout', validate(validateLogout), authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
