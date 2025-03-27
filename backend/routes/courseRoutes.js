import express from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
} from "../controller/courseController.js";
import { auth } from "../middleware/auth.js";
import { isTeacher } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(auth);

router.get("/", getAllCourses);
router.get("/:id", getCourseById);

router.post("/", isTeacher, createCourse);
router.put("/:id", isTeacher, updateCourse);
router.delete("/:id", isTeacher, deleteCourse);

router.post("/:courseId/enroll", isTeacher, enrollStudent);
router.delete("/:courseId/students/:studentId", isTeacher, unenrollStudent);

export default router;
