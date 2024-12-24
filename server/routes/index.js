import express from "express";
import userRoutes from "./userRoutes.js";
import taskRoutes from "./taskRoutes.js";
import dailyReportRoutes from "./dailyReportRoutes.js"

const router = express.Router();

router.use("/user", userRoutes); //api/user/login
router.use("/task", taskRoutes);
router.use("/daily-reports", dailyReportRoutes);

export default router;
