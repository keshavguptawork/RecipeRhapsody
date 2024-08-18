import { Router } from "express";
import { changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser, upadteAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// http://localhost:3000/api/v1/users/register
router.route("/register").post(
  upload.fields([          // using multer middleware upload function
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
) 
router.route("/login").post(loginUser)

// secured routes: requires a loggedIn user
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/changePassword").post(changeCurrentPassword)
router.route("/updateAccDetails").post(upadteAccountDetails)
router.route("/updateAvatar").post(updateUserAvatar)
router.route("/updateCoverImage").post(updateUserCoverImage)

export default router