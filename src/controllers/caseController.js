const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    console.error("Fehler beim Erstellen des Falls:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Falls" });
  }
};

exports.getAllCases = async (req, res) => {
  try {
    const cases = await prisma.case.findMany({});
    res.json(cases);
  } catch (error) {
    console.error("Fehler beim Abrufen der Fälle:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Fälle" });
  }
};

exports.getCasesByUser = async (req, res) => {
  try {
    const { role, userId } = req.user;

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
      const userCases = await prisma.userCase.findMany({
        where: { userId: userId },
        include: { case: true },
      });

      const cases = userCases.map((userCase) => userCase.case);
      res.json(cases);
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Fälle des Benutzers:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Fälle" });
  }
};

exports.getCasesByIndustry = async (req, res) => {
  const { industry } = req.query;

  try {
    const cases = await prisma.case.findMany({
      where: { industry },
    });

    res.json(cases);
  } catch (error) {
    console.error("Fehler beim Abrufen der Fälle nach Branche:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Fälle" });
  }
};

exports.addUserToCase = async (req, res) => {
  const { caseId } = req.params;
  let { userId } = req.body;
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  try {
    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Fall nicht gefunden" });
    }

    if (requesterRole === "admin") {
      if (!userId) {
        return res.status(400).json({ error: "userId ist für Admin erforderlich" });
      }
    } else {
      if (!userId) {
        userId = requesterUserId;
      }
    }

    const userCase = await prisma.userCase.findFirst({
      where: {
        userId: userId,
        caseId: parseInt(caseId),
      },
    });
    if (userCase) {
      return res.status(400).json({ error: "Benutzer ist bereits in diesem Fall eingeschrieben" });
    }

    await prisma.userCase.create({
      data: {
        userId: userId,
        caseId: parseInt(caseId),
      },
    });

    res.status(201).json({ message: "Benutzer zum Fall hinzugefügt" });
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Benutzers zum Fall:", error);
    res.status(500).json({ error: "Fehler beim Hinzufügen des Benutzers zum Fall" });
  }
};

exports.removeUserFromCase = async (req, res) => {
  const { caseId } = req.params;
  let { userId } = req.query;
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  try {
    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Fall nicht gefunden" });
    }

    if (requesterRole === "admin") {
      if (!userId) {
        return res.status(400).json({ error: "userId ist für Admin erforderlich" });
      }
    } else {
      userId = requesterUserId.toString();
    }

    const userToRemove = await prisma.userCase.findFirst({
      where: {
        userId: parseInt(userId),
        caseId: parseInt(caseId),
      },
    });
    if (!userToRemove) {
      return res.status(400).json({ error: "Benutzer ist nicht in diesem Fall eingeschrieben" });
    }

    await prisma.userCase.delete({
      where: {
        id: userToRemove.id,
      },
    });

    res.status(200).json({ message: "Benutzer erfolgreich aus dem Fall entfernt" });
  } catch (error) {
    console.error("Fehler beim Entfernen des Benutzers aus dem Fall:", error);
    res.status(500).json({ error: "Fehler beim Entfernen des Benutzers aus dem Fall" });
  }
};

exports.deleteCase = async (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const requesterRole = req.user.role;

  try {
    if (requesterRole !== "admin") {
      return res.status(403).json({ error: "Unberechtigt, den Fall zu löschen" });
    }

    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!existingCase) {
      return res.status(404).json({ error: "Fall nicht gefunden" });
    }

    await prisma.userCase.deleteMany({
      where: { caseId: caseId },
    });

    await prisma.message.deleteMany({
      where: { caseId: caseId },
    });

    await prisma.case.delete({
      where: { id: caseId },
    });

    res.status(200).json({ message: "Fall und zugehörige Einträge erfolgreich gelöscht" });
  } catch (error) {
    console.error("Fehler beim Löschen des Falls:", error);
    res.status(500).json({ error: "Fehler beim Löschen des Falls und der zugehörigen Einträge" });
  }
};

exports.getEnrolledUsersCount = async (req, res) => {
  try {
    const { caseId } = req.params;

    const existingCase = await prisma.case.findUnique({
      where: { id: parseInt(caseId) },
    });
    
    if (!existingCase) {
      return res.status(404).json({ error: "Fall nicht gefunden" });
    }

    const count = await prisma.userCase.count({
      where: { caseId: parseInt(caseId) },
    });

    res.json({ count });
  } catch (error) {
    console.error("Fehler beim Abrufen der Anzahl der eingeschriebenen Benutzer:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Anzahl der eingeschriebenen Benutzer" });
  }
};

exports.getCasesWithMostEnrolledUsers = async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      include: {
        users: true,
      },
    });

    cases.sort((a, b) => b.users.length - a.users.length);

    res.json(cases.slice(0, 4));
  } catch (error) {
    console.error("Fehler beim Abrufen der Fälle mit den meisten eingeschriebenen Benutzern:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Fälle mit den meisten eingeschriebenen Benutzern" });
  }
};

exports.sendMessageToCase = async (req, res) => {
  const { caseId } = req.params;
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Ungültiger Nachrichtentext' });
  }

  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const newMessage = await prisma.message.create({
      data: {
        text,
        userId: userId,
        caseId: parseInt(caseId),
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Fehler beim Senden der Nachricht:', error);
    res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden' });
  }
};

exports.getAllMessagesForCase = async (req, res) => {
  const { caseId } = req.params;

  try {
    const parsedCaseId = parseInt(caseId);

    const messages = await prisma.message.findMany({
      where: {
        caseId: parsedCaseId,
      },
      include: {
        user: true,
        case: true,
      },
    });

    const modifiedMessages = messages.map(async message => {
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

    const resolvedModifiedMessages = await Promise.all(modifiedMessages);

    res.status(200).json(resolvedModifiedMessages);
  } catch (error) {
    console.error('Fehler beim Abrufen der Nachrichten für den Fall:', error);
    res.status(500).json({ error: 'Nachrichten für den Fall konnten nicht abgerufen werden' });
  }
};

module.exports = exports;
