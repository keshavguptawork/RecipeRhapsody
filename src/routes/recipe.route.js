import { Router } from "express";
import {
  newRecipe,
  getRecipe,
  getAllRecipes,
  updateRecipe
} from "../controllers/recipe.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// http://localhost:3000/api/v1/recipe/register
// secured routes: requires a loggedIn user
router.route("/new-recipe").post(
  verifyJWT,
  upload.fields([          // using multer middleware upload function
    {
      name: "thumbnail",
      maxCount: 1
    },
    {
      name: "pictures",
      maxCount: 3
    }
  ]),
  newRecipe
) 
router.route("/view-recipe").get(verifyJWT, getRecipe)
router.route("/view-all-recipes").get(verifyJWT, getAllRecipes)
router.route("/update-recipe").patch(verifyJWT, updateRecipe) 
// router.route("/history").get(verifyJWT, getUserWatchHistory)
// router.route("/make-recipe-list").get(verifyJWT, newRecipeList)

export default router