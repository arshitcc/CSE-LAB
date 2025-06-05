import { Router } from "express";
import {
  userRegister,
  userLogin,
  userLogout,
  verifyEmail,
  resendVerificationEmail,
  updateRefreshAndAccessToken,
  forgotPasswordRequest,
  resetForgottenPassword,
  changeCurrentPassword,
  assignRole,
  getCurrentUser,
  changeAvatar,
} from "./controller";
import { validate } from "../../../middlewares/validator.middleware";
import {
  userAssignRoleValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordRequestValidator,
  userLoginValidation,
  userRegisterValidation,
  userResetForgottenPasswordValidator,
} from "../../../validators/auth.validators";
import {
  authenticateUser,
  verifyPermission,
} from "../../../middlewares/auth.middleware";
import { mongoIdPathVariableValidator } from "../../../validators/common/mongodb/mongodb.validators";
import { UserRoles } from "../../../generated/prisma";


const router = Router();

router.route("/").get(authenticateUser, getCurrentUser);
router.route("/signup").post(userRegisterValidation(), validate, userRegister);
router.route("/login").post(userLoginValidation(), validate, userLogin);

router.route("/logout").post(authenticateUser, userLogout);

router
  .route("/refresh-tokens")
  .post(authenticateUser, updateRefreshAndAccessToken);

router.route("/verify").get(verifyEmail);

router
  .route("/forgot-password")
  .post(userForgotPasswordRequestValidator(), validate, forgotPasswordRequest);

router
  .route("/reset-password")
  .post(
    userResetForgottenPasswordValidator(),
    validate,
    resetForgottenPassword,
  );

router.route("/profile/change-avatar").post(authenticateUser, changeAvatar);

router
  .route("/profile/resend-verification-email")
  .post(authenticateUser, resendVerificationEmail);

router
  .route("/profile/change-current-password")
  .post(
    authenticateUser,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword,
  );

router
  .route("/profile/assign-role/:userId")
  .post(
    authenticateUser,
    verifyPermission([UserRoles.ADMIN]),
    mongoIdPathVariableValidator("userId"),
    userAssignRoleValidator(),
    assignRole,
  );

export default router;
