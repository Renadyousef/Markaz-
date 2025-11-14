// server/src/routes/studyPlanTasksRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getPlanMeta,
  listTasksByPlan,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/studyPlanTasksController");

// بيانات الخطة (العنوان + العداد للعرض)
router.get("/:planId", verifyToken, getPlanMeta);

// مهام الخطة
router.get("/:planId/tasks", verifyToken, listTasksByPlan);

// إنشاء/تعديل/حذف مهمة (هذه المسارات فقط هي اللي تعدّل tasksCount)
router.post("/:planId/tasks", verifyToken, createTask);
router.patch("/:planId/tasks/:taskId", verifyToken, updateTask);
router.delete("/:planId/tasks/:taskId", verifyToken, deleteTask);

module.exports = router;
