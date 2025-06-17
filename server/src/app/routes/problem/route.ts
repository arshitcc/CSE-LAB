import { Router } from "express";
import {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblems,
  getUserSolvedProblems,
} from "./controller";
import { createProblemValidators } from "../../../validators/problem.validators";
import { validate } from "../../../middlewares/validator.middleware";
import {
  authenticateUser,
  verifyPermission,
} from "../../../middlewares/auth.middleware";
import { UserRoles } from "../../../generated/prisma";
import { upload } from "../../../middlewares/multer.middleware";

const router = Router();

router
  .route("/")
  .post(
    authenticateUser,
    verifyPermission([UserRoles.ADMIN]),
    createProblemValidators(),
    upload.array("attachments", 3),
    validate,
    createProblem,
  )
  .get(authenticateUser, getAllProblems);

router.route("/solved").get(authenticateUser, getUserSolvedProblems);

router
  .route("/:problemId")
  .get(authenticateUser, getProblemById)
  .put(authenticateUser, verifyPermission([UserRoles.ADMIN]), updateProblem)
  .delete(authenticateUser, verifyPermission([UserRoles.ADMIN]), deleteProblem);

export default router;
