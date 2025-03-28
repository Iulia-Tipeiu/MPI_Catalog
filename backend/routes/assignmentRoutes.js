import express from "express";
import {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addOrUpdateGrade,
  deleteGrade,
} from "../controller/assignmentController.js";
import { auth } from "../middleware/auth.js";
import { isTeacher } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(auth);

router.post("/courses/:courseId/assignments", isTeacher, createAssignment);
router.get("/courses/:courseId/assignments", getAssignmentsByCourse);
router.get("/assignments/:assignmentId", getAssignmentById);
router.put("/assignments/:assignmentId", isTeacher, updateAssignment);
router.delete("/assignments/:assignmentId", isTeacher, deleteAssignment);

router.post("/assignments/:assignmentId/grades", isTeacher, addOrUpdateGrade);
router.delete("/grades/:gradeId", isTeacher, deleteGrade);

export default router;
