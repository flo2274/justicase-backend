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

app.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  // Custom validation
  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    let role = "user";
    if (username === "admin") {
      role = "admin";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role, // Assigning the determined role
      },
    });

    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    // Return token and user details
    res
      .status(200)
      .json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post(
  "/cases",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { name, companyType, industry } = req.body;
    const userId = req.user.userId;

    try {
      const result = await prisma.$transaction(async (prisma) => {
        const newCase = await prisma.case.create({
          data: {
            name,
            companyType,
            industry,
          },
        });

        await prisma.userCase.create({
          data: {
            userId: userId,
            caseId: newCase.id,
          },
        });

        return newCase;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).json({ error: "Failed to create case" });
    }
  })
);

app.get(
  "/cases",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    try {
      const cases = await prisma.case.findMany({});
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  })
);

app.get("/getmycases", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userCases = await prisma.userCase.findMany({
      where: { userId: userId },
      include: {
        case: true,
      },
    });

    const cases = userCases.map((userCase) => userCase.case);

    res.json(cases);
  } catch (error) {
    console.error("Error fetching user's cases:", error);
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
  "/addusertocase",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { caseId, userId } = req.body;
    const requesterUserId = req.user.userId;
    const requesterRole = req.user.role;

    try {
      // Check if the case exists
      const existingCase = await prisma.case.findUnique({
        where: { id: caseId },
      });
      if (!existingCase) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (requesterRole === "admin") {
        // Admin logic: require userId in request body
        if (!userId) {
          return res
            .status(400)
            .json({ error: "userId is required for admin" });
        }
      } else {
        // Non-admin logic: use requesterUserId as userId
        userId = requesterUserId;
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

      // Enroll user into the case
      await prisma.userCase.create({
        data: {
          userId: userId,
          caseId: caseId,
        },
      });

      res.status(201).json({ message: "Enrollment successful" });
    } catch (error) {
      console.error("Error enrolling to case:", error);
      res.status(500).json({ error: "Failed to enroll into case" });
    }
  })
);

app.post(
  "/removeuserfromcase",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { caseId, userId } = req.body;
    const requesterUserId = req.user.userId;
    const requesterRole = req.user.role;

    try {
      // Check if the case exists
      const existingCase = await prisma.case.findUnique({
        where: { id: caseId },
      });
      if (!existingCase) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (requesterRole === "admin") {
        // Admin logic: require userId in request body
        if (!userId) {
          return res
            .status(400)
            .json({ error: "userId is required for admin" });
        }
      } else {
        // Non-admin logic: use requesterUserId as userId
        userId = requesterUserId;
      }

      // Check if the user is enrolled in the case
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

      // Remove user from the case
      await prisma.userCase.delete({
        where: {
          id: userCase.id,
        },
      });

      res.status(200).json({ message: "User removed from case successfully" });
    } catch (error) {
      console.error("Error removing from case:", error);
      res.status(500).json({ error: "Failed to remove user from case" });
    }
  })
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
