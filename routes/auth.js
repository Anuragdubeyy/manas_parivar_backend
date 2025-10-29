const express = require('express');
const { registerUser, loginUser, registerAdmin } = require('../controller/authController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/registerAdmin', registerAdmin);

module.exports = router;