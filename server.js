require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);


const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};


const validateUserData = (req, res, next) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required' });
  }
  next();
};


const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
};


app.post('/register', validateUserData, asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      email,
    },
  });
  const token = generateToken(newUser);
  res.status(201).json({ user: newUser, token });
}));


app.post('/login', asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Überprüfen, ob entweder eine E-Mail-Adresse oder ein Benutzername vorhanden ist
  if (!(email || username) || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let user;
  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
  } else {
    user = await prisma.user.findUnique({ where: { username } });
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.status(200).json({ message: 'Login successful', user, token });
}));

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/users', authenticateJWT, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});


app.post('/cases', authenticateJWT, asyncHandler(async (req, res) => {
  const { name, companyType, industry } = req.body;

  if (!name || !companyType || !industry) {
    return res.status(400).json({ error: 'Name, companyType, and industry are required' });
  }

  try {
    const newCase = await prisma.case.create({
      data: {
        name,
        companyType,
        industry,
      },
    });

    res.status(201).json({ case: newCase });
  } catch (error) {
    console.error('Error creating new case:', error);
    res.status(500).json({ error: 'Failed to create new case' });
  }
}));


app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
