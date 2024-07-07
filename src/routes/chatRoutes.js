const express = require("express");
const { getMessages, sendMessage } = require("../controllers/messageController");
const authenticateJWT = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/:caseId/messages", authenticateJWT, asyncHandler(getMessages));
router.post("/:caseId/messages", authenticateJWT, asyncHandler(sendMessage));

module.exports = router;
