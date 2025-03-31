import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  resetPassword,
} from "../controller/authController.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("username").isAlphanumeric().withMessage("Invalid username."),
    body("email").isEmail().withMessage("Invalid email."),
    body("password").isLength({ min: 6 }).withMessage("Password too short."),
  ],
  register
);
router.post("/login", login);
router.post("/reset-password", resetPassword);

export default router;
