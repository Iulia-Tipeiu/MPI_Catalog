// Fișier nou: routes/gradeRoutes.js
import express from "express";
import {
  getStudentGrades,
  getStudentGradesByCourse,
  getStudentGradeHistory,
  getStudentGradeStatistics,
} from "../controller/gradeController.js";
import { auth } from "../middleware/auth.js";
import { isStudent } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(auth);
router.use(isStudent);

router.get("/grades", getStudentGrades);
router.get("/courses/:courseId/grades", getStudentGradesByCourse);
router.get("/grades/history", getStudentGradeHistory);
router.get("/grades/statistics", getStudentGradeStatistics);

export default router;
