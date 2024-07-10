const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Erstellt einen neuen Fall
exports.createCase = async (req, res) => {
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
};

// Holt alle Fälle
exports.getAllCases = async (req, res) => {
  try {
    const cases = await prisma.case.findMany({});
    res.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
};

// Holt Fälle für einen bestimmten Benutzer
exports.getCasesByUser = async (req, res) => {
  try {
    const { role, userId } = req.user;

    // Wenn der Benutzer ein Administrator ist, kann nach einer spezifischen userId gefiltert werden
    if (role === "admin") {
      const { userId: requestedUserId } = req.query;
      const targetUserId = requestedUserId ? parseInt(requestedUserId) : userId;

      const userCases = await prisma.userCase.findMany({
        where: { userId: targetUserId },
        include: { case: true },
      });

      const cases = userCases.map((userCase) => userCase.case);
      res.json(cases);
    } else {
      // Normaler Benutzer kann nur seine eigenen Fälle sehen
      const userCases = await prisma.userCase.findMany({
        where: { userId: userId },
        include: { case: true },
      });

      const cases = userCases.map((userCase) => userCase.case);
      res.json(cases);
    }
  } catch (error) {
    console.error("Error fetching user's cases:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
};

// Holt Fälle nach Branche
exports.getCasesByIndustry = async (req, res) => {
  const { industry } = req.query;

  try {
    const cases = await prisma.case.findMany({
      where: { industry },
    });

    res.json(cases);
  } catch (error) {
    console.error("Error fetching cases by industry:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
};

// Fügt einen Benutzer zu einem Fall hinzu
exports.addUserToCase = async (req, res) => {
  const { caseId } = req.params;
  let { userId } = req.body;
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  try {
    // Überprüfen, ob der Fall existiert
    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Admin-Logik: Überprüfen, ob userId im Request-Body vorhanden ist
    if (requesterRole === "admin") {
      if (!userId) {
        return res.status(400).json({ error: "userId is required for admin" });
      }
    } else {
      // Falls kein userId im Request-Body ist, nutze requesterUserId
      if (!userId) {
        userId = requesterUserId;
      }
    }

    // Überprüfen, ob der Benutzer bereits dem Fall zugeordnet ist
    const userCase = await prisma.userCase.findFirst({
      where: {
        userId: userId,
        caseId: parseInt(caseId),
      },
    });
    if (userCase) {
      return res
        .status(400)
        .json({ error: "User already enrolled in this case" });
    }

    // Benutzer dem Fall hinzufügen
    await prisma.userCase.create({
      data: {
        userId: userId,
        caseId: parseInt(caseId),
      },
    });

    res.status(201).json({ message: "User added to case" });
  } catch (error) {
    console.error("Error adding user to case:", error);
    res.status(500).json({ error: "Failed to add user to case" });
  }
};

// Entfernt einen Benutzer aus einem Fall
exports.removeUserFromCase = async (req, res) => {
  const { caseId } = req.params;
  let { userId } = req.query; // userId als Query-Parameter
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  try {
    // Überprüfen, ob der Fall existiert
    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    if (requesterRole === "admin") {
      // Admin-Logik: userId im Query-Parameter erforderlich
      if (!userId) {
        return res.status(400).json({ error: "userId is required for admin" });
      }
    } else {
      // Nicht-Admin-Logik: Verwenden von requesterUserId als userId
      userId = requesterUserId.toString();
    }

    // Überprüfen, ob der Benutzer im Fall eingeschrieben ist
    const userToRemove = await prisma.userCase.findFirst({
      where: {
        userId: parseInt(userId), // Konvertiere userId zu einer Zahl
        caseId: parseInt(caseId),
      },
    });
    if (!userToRemove) {
      return res
        .status(400)
        .json({ error: "User is not enrolled in this case" });
    }

    // Benutzer aus dem Fall entfernen
    await prisma.userCase.delete({
      where: {
        id: userToRemove.id,
      },
    });

    res.status(200).json({ message: "User removed from case successfully" });
  } catch (error) {
    console.error("Error removing user from case:", error);
    res.status(500).json({ error: "Failed to remove user from case" });
  }
};

// Löscht einen Fall
exports.deleteCase = async (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const requesterRole = req.user.role;

  try {
    // Überprüfen, ob der Benutzer ein Administrator ist
    if (requesterRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized to delete case" });
    }

    // Überprüfen, ob der Fall existiert
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Löschen aller zugehörigen Einträge in der UserCase-Tabelle
    await prisma.userCase.deleteMany({
      where: { caseId: caseId },
    });

    // Fall löschen
    await prisma.case.delete({
      where: { id: caseId },
    });

    res.status(200).json({ message: "Case deleted successfully" });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({ error: "Failed to delete case" });
  }
};

exports.getEnrolledUsersCount = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Überprüfen, ob der Fall existiert
    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });

    if (!existingCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Zähle die eingetragenen Benutzer für den Fall
    const count = await prisma.userCase.count({
      where: { caseId: parseInt(caseId) },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching enrolled users count:", error);
    res.status(500).json({ error: "Failed to fetch enrolled users count" });
  }
};

// Holt Fälle mit den meisten eingeschriebenen Benutzern
exports.getCasesWithMostEnrolledUsers = async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      include: {
        users: true,
      },
    });

    // Sortiere die Fälle nach der Anzahl der eingetragenen Benutzer in absteigender Reihenfolge
    cases.sort((a, b) => b.users.length - a.users.length);

    res.json(cases.slice(0, 4)); // Nimm die Top 4 Fälle mit den meisten eingetragenen Benutzern
  } catch (error) {
    console.error("Error fetching cases with most enrolled users:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch cases with most enrolled users" });
  }
};

exports.sendMessageToCase = async (req, res) => {
  const { caseId } = req.params;
  const { text } = req.body;

  // Überprüfung der Eingabewerte
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid message text" });
  }

  try {
    const userId = req.user.userId;

    // Überprüfen, ob der Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Erstellen der neuen Nachricht
    const newMessage = await prisma.message.create({
      data: {
        text,
        userId: userId,
        caseId: parseInt(caseId),
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.getAllMessagesForCase = async (req, res) => {
  const { caseId } = req.params;

  try {
    // Convert caseId to integer
    const parsedCaseId = parseInt(caseId);

    // Fetch messages for the given caseId including related user data
    const messages = await prisma.message.findMany({
      where: {
        caseId: parsedCaseId,
      },
      include: {
        user: true,
        case: true,
      },
    });

    // Modify each message object to include the username of the sender
    const modifiedMessages = messages.map(async (message) => {
      const { userId, ...rest } = message;
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          username: true,
        },
      });
      return {
        ...rest,
        userId: userId,
        username: user.username,
      };
    });

    // Resolve all promises in modifiedMessages array
    const resolvedModifiedMessages = await Promise.all(modifiedMessages);

    res.status(200).json(resolvedModifiedMessages);
  } catch (error) {
    console.error("Error fetching messages for case:", error);
    res.status(500).json({ error: "Failed to fetch messages for case" });
  }
};

module.exports = exports;
