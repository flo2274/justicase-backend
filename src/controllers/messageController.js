const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /cases/:caseId/messages
const sendMessage = async (req, res) => {
  const { caseId } = req.params;
  const { text, sender, timestamp } = req.body;

  // Überprüfung der Eingabewerte
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid message text' });
  }

  if (!sender || typeof sender !== 'string') {
    return res.status(400).json({ error: 'Invalid sender' });
  }

  if (!timestamp || isNaN(Date.parse(timestamp))) {
    return res.status(400).json({ error: 'Invalid timestamp' });
  }

  try {
    // Versuchen, den Benutzer anhand des Sendernamens zu finden
    let user = await prisma.user.findFirst({
      where: {
        name: sender,
      },
    });

    // Wenn der Benutzer nicht gefunden wird, erstellen Sie ihn
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: sender,
        },
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        text,
        sender,
        timestamp: new Date(timestamp),
        case: {
          connect: { id: parseInt(caseId) },
        },
        userId: user.id, // Verbinden Sie die Nachricht mit dem Benutzer
      },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

module.exports = {
  sendMessage,
};
