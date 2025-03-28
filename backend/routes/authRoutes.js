import express from "express";
import {
  register,
  login,
  resetPassword,
} from "../controller/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);

export default router;
