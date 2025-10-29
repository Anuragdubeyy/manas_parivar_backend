const express = require('express');
const { protect, admin } = require('../middelware/auth');
const { getUsers, deleteUser, blockUser } = require('../controller/userController');
const router = express.Router();

router.get('/get-users', protect, admin, getUsers);
router.delete('/delete-user/:id', protect, admin, deleteUser);
router.put('/block-user/:id', protect, admin, blockUser);

module.exports = router;