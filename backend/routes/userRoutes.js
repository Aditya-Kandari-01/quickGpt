import express from "express";
import {
  registerUser,
  getUser,
  loginUser,
  getPublishedImages,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/data", protect, getUser);
userRouter.get("/published-images", protect, getPublishedImages);

export default userRouter;
