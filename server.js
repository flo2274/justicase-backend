require("dotenv").config();

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};

const validateUserData = (req, res, next) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ error: "Username, password, and email are required" });
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
};

app.post(
  "/register",
  validateUserData,
  asyncHandler(async (req, res) => {
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
  })
);

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    res.status(200).json({ message: "Login successful", user, token });
  })
);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
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

app.get("/users", authenticateJWT, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post(
  "/cases",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { name, companyType, industry } = req.body;
    const userId = req.user.id;

    const newCase = await prisma.case.create({
      data: {
        name,
        companyType,
        industry,
      },
    });

    // Create an entry in the UserCase table
    await prisma.userCase.create({
      data: {
        userId: userId,
        caseId: newCase.id,
      },
    });

    res.status(201).json(newCase);
  })
);

app.get(
  "/cases",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const cases = await prisma.case.findMany({});
    res.json(cases);
  })
);

app.get("/getmycases", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const userCases = await prisma.userCase.findMany({
      where: { userId: userId },
      include: {
        case: true,
      },
    });

    const cases = userCases.map((userCase) => userCase.case);

    res.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});

app.get("/getusersbycase/:caseId", authenticateJWT, async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId);

    const userCases = await prisma.userCase.findMany({
      where: { caseId: caseId },
      include: {
        user: true,
      },
    });

    const users = userCases.map((userCase) => userCase.user);

    res.json(users);
  } catch (error) {
    console.error("Error fetching users by case:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post(
  "/enrolltocase",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { caseId } = req.body;
    const userId = req.user.id;

    // Check if the case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Check if the user is already enrolled in the case
    const userCase = await prisma.userCase.findFirst({
      where: {
        userId: userId,
        caseId: caseId,
      },
    });
    if (userCase) {
      return res
        .status(400)
        .json({ error: "User already enrolled in this case" });
    }

    // Enroll the user into the case
    await prisma.userCase.create({
      data: {
        userId: userId,
        caseId: caseId,
      },
    });

    res.status(201).json({ message: "Enrollment successful" });
  })
);

app.post(
  "/removefromcase",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { caseId } = req.body;
    const userId = req.user.id;

    const userCase = await prisma.userCase.findFirst({
      where: {
        userId: userId,
        caseId: caseId,
      },
    });
    if (!userCase) {
      return res
        .status(400)
        .json({ error: "User is not enrolled in this case" });
    }

    await prisma.userCase.delete({
      where: {
        id: userCase.id,
      },
    });

    res.status(200).json({ message: "User removed from case successfully" });
  })
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
