import { Router } from "express";
import { 
  changeCurrentPassword, getCurrentUser, 
  getUserChannelProfile, 
  getUserWatchHistory, 
  loginUser, logoutUser, refreshAccessToken, 
  registerUser, updateAccountDetails, updateUserAvatar, 
  updateUserCoverImage 
} from "../controllers/user.controller.js";
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
router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/update-acc-details").patch(verifyJWT, updateAccountDetails) // patch 
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"),updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getUserWatchHistory)

export default router