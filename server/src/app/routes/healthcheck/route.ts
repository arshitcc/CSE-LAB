import { Router } from "express";
import checkHealth from "./controller";

const router = Router();

router.route("/").get(checkHealth);

export default router;
