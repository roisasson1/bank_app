const express = require('express');
const { signup, login, verifyPhone, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/sign-up', signup);
router.post('/login', login);
router.post('/sign-up/validate', verifyPhone);
router.delete('/logout', authenticateToken, logout);

module.exports = router;