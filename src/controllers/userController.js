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
    // Überprüfen, ob der Anforderer ein Administrator oder der Besitzer des zu löschenden Benutzers ist
    if (requesterRole !== "admin" && userIdToDelete !== requesterUserId) {
      return res.status(403).json({ error: "Unauthorized to delete user" });
    }

    // Überprüfen, ob der Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Löschen aller zugehörigen Einträge in der UserCase-Tabelle
    await prisma.userCase.deleteMany({
      where: { userId: userIdToDelete },
    });

    // Benutzer löschen
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
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

module.exports = exports;
