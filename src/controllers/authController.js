const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authService = require("../services/authService");

exports.register = async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ error: "Alle Felder sind erforderlich" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Ungültiges E-Mail-Format" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "E-Mail ist bereits registriert" });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: "Benutzername ist bereits vergeben" });
    }

    let role = "user";
    if (username === "admin") {
      role = "admin";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role,
      },
    });

    res.status(201).json({ message: "Registrierung erfolgreich" });
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    res.status(500).json({ error: "Registrierung fehlgeschlagen" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Ungültige E-Mail" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Ungültige E-Mail oder Passwort" });
    }

    const token = authService.generateToken(user);

    res.status(200).json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
