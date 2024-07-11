const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({});
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.deleteUser = async (req, res) => {
  const userIdToDelete = parseInt(req.params.userId);
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  try {
    if (requesterRole !== "admin" && userIdToDelete !== requesterUserId) {
      return res.status(403).json({ error: "Nicht berechtigt, den Benutzer zu löschen" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    await prisma.userCase.deleteMany({
      where: { userId: userIdToDelete },
    });

    await prisma.message.deleteMany({
      where: { userId: userIdToDelete },
    });

    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    res.status(200).json({ message: "Benutzer und zugehörige Einträge erfolgreich gelöscht" });
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Löschen des Benutzers und zugehöriger Einträge" });
  }
};


exports.getUsersByCase = async (req, res) => {
  const { caseId } = req.params;

  try {
    const userCases = await prisma.userCase.findMany({
      where: { caseId: parseInt(caseId) },
      include: { user: true },
    });

    const users = userCases.map((userCase) => userCase.user);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by case:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
