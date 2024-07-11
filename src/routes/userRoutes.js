const express = require("express");
const { getAllUsers, deleteUser, getUsersByCase } = require("../controllers/userController");
const authenticateJWT = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", authenticateJWT, asyncHandler(getAllUsers));
router.delete("/:userId", authenticateJWT, asyncHandler(deleteUser));
router.get("/case/:caseId", authenticateJWT, asyncHandler(getUsersByCase));

module.exports = router;
