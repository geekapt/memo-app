const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.signup);
router.post('/login', authController.login);

// Protected routes
router.use(authController.protect); // All routes after this require authentication

router.get('/me', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
