const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Funktionen für die Routen-Handler

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
      return res.status(400).json({ error: "User already enrolled in this case" });
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

exports.removeUserFromCase = async (req, res) => {
  const { caseId } = req.params;
  let { userId } = req.query; // userId als Query-Parameter
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  try {
    // Check if the case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    if (requesterRole === "admin") {
      // Admin logic: require userId in request query
      if (!userId) {
        return res.status(400).json({ error: "userId is required for admin" });
      }
    } else {
      // Non-admin logic: use requesterUserId as userId
      userId = requesterUserId.toString();
    }

    // Check if the user is enrolled in the case
    const userToRemove = await prisma.userCase.findFirst({
      where: {
        userId: parseInt(userId), // Konvertiere userId zu einer Zahl
        caseId: parseInt(caseId),
      },
    });
    if (!userToRemove) {
      return res.status(400).json({ error: "User is not enrolled in this case" });
    }

    // Remove user from the case
    await prisma.userCase.delete({
      where: {
        id: userToRemove.id,
      },
    });

    res.status(200).json({ message: "User removed from case successfully" });
  } catch (error) {
    console.error("Error removing from case:", error);
    res.status(500).json({ error: "Failed to remove user from case" });
  }
};




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



// Zählt die eingetragenen Benutzer für einen Fall
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
