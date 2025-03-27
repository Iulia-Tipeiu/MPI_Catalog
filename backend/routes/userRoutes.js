import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controller/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/change-password", changePassword);

export default router;
