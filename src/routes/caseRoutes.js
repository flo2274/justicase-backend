const express = require("express");
const {
  createCase,
  deleteCase,
  getAllCases,
  getCasesByUser,
  getCasesByIndustry,
  addUserToCase,
  removeUserFromCase,
  getEnrolledUsersCount,
  getCasesWithMostEnrolledUsers,
} = require("../controllers/caseController");
const authenticateJWT = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/", authenticateJWT, asyncHandler(createCase));
router.get("/", authenticateJWT, asyncHandler(getAllCases));
router.get("/user", authenticateJWT, asyncHandler(getCasesByUser));
router.get("/industry", authenticateJWT, asyncHandler(getCasesByIndustry));
router.post("/:caseId/user", authenticateJWT, asyncHandler(addUserToCase));
router.delete("/:caseId/user", authenticateJWT, asyncHandler(removeUserFromCase));
router.delete("/:caseId", authenticateJWT, asyncHandler(deleteCase));
router.get("/:caseId/count/users", authenticateJWT, asyncHandler(getEnrolledUsersCount));
router.get("/most-enrolled", authenticateJWT, asyncHandler(getCasesWithMostEnrolledUsers)); // Neue Route hinzugefügt

module.exports = router;
