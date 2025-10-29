const jwt = require('jsonwebtoken');
const User = require('../model/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Register Admin
const registerAdmin = async (req, res) => {
  const { name, email, password, age, dob, work, mobile } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      age,
      dob,
      work,
      mobile,
      role: 'admin',
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// Register User
const registerUser = async (req, res) => {
  const { name, email, password, age, dob, work, mobile } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      age,
      dob,
      work,
      mobile,
      role:'user'
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({  message: 'Registration successful',token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// Login User
const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
  // find user by email OR name
    const user = await User.findOne({
      $or: [{ email: identifier }, { name: identifier }],
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user) {
      console.log('User found:', user.email);
      console.log('Stored hashed password:', user.password);
      console.log('Entered password:', password);

      const isMatch = await user.comparePassword(password.trim());
      console.log('Password match:', isMatch);

      if (isMatch) {
        if (user.isBlocked) {
          return res.status(403).json({ message: 'User is blocked' });
        }

        const token = jwt.sign({ id: user._id , role: user.role}, process.env.JWT_SECRET, {
          expiresIn: '50d',
        });

        return res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            age: user.age,
            dob: user.dob,
            work: user.work,
            mobile: user.mobile,
            role: user.role,
          },
        });
      }
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerAdmin, registerUser, loginUser };