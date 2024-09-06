import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiError.utils.js"
import { User } from "../models/user.model.js" 
import { Recipe } from "../models/recipe.model.js"
import {uploadOnCloudinary} from "../utils/cloudinaryUpload.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

// new-recipe endpoint
const newRecipe = asyncHandler( async(req, res) => {
  // get user and recipe details from front end  
  const {username, title, description, duration, recipeContent} = req.body 

  // validation like , not empty
  if(username.trim() === "" || title.trim() === "" || recipeContent.trim() === ""){
    throw new ApiError(400, "All fields are required")
  }

  // check if recipe already exits based on username and title
  const existingUser = await User.findOne({ 
    $and: [{ username }, { title }]
  })
  if(existingUser){
    throw new ApiError(409, "Recipe already exists")
  }

  // check for images, check for thumbnail
  // chaining to see whether resources are available?
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path       

  if(!thumbnailLocalPath){
    throw new ApiError(400, "Thumbnail file is required!")
  }
  let recipeImageLocalPath; // const coverImageLocalPath = req.files?.coverImage[0]?.path
  if(req.files && Array.isArray(req.files.recipeImage) && req.files.recipeImage.length > 0){
    recipeImageLocalPath = req.files.recipeImage[0].path
  }

  // upload them to cloudinary, validate avatar
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
  const recipeImage = await uploadOnCloudinary(recipeImageLocalPath)

  if(!thumbnail){ 
    throw new ApiError(500, "Something went wrong while uploading thumbnail")
  }

  // create recipe object - create entry in db
  const recipe = await Recipe.create({
    title, 
    username: username.toLowerCase() ,
    thumbnail: thumbnail.url, // only store cloudinary url of thumbnail in db
    recipeImage: recipeImage?.url || "", // store if coverImage url is available
    description,
    recipeContent,
    duration,   
  })
  
  // check for user and response & remove password, refresh token
  const newRecipe = await Recipe.findById(recipe._id)
  if(!newRecipe){
    throw new ApiError(500, "Something went wrong while posting the recipe")
  }

  // return response
  return res.status(201).json(
    new ApiResponse(200, newRecipe, "Recipe successfully posted!")
  )
  
})

// view-recipe 
const getRecipe = asyncHandler(async(req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")

})

// view-all-recipe
const getAllRecipes = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body
  if(!fullName || !email){
    throw new ApiError(400, "New full-name/email is required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new: true}   // return new updated information
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

// update-recipe
const updateRecipe = asyncHandler( async(req, res) => {
  const {username} = req.params
  if(!username?.trim()){
    throw new ApiError(400, "Username is missing")
  }
  const channel = User.aggregate([
    {
      $match: { username : username?.toLowerCase() } // FINDS THE USER
    },
    {
      $lookup: // FINDS USER"S SUBSCRIBER
        { from: "subscription", /*mongo autoconverts db name*/  
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"  // goes into addField
        }
    },
    {
      $lookup: // FINDS CHANNELS to which USER HAS SUBSCRIBED
        { from: "subscription", /*mongo autoconverts db name*/  
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo"  // goes into addField
        }
    },
    {
      $addFields: // ADD FIELDS IN FIRST QUERY
      { subscribersCount: { $size:"$subscriber" },
        channelsSubscribedToCount: { $size:"subscribedTo" },
        isSubscribed: 
        { $cond: 
          { if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          } 
        }
      }
    },
    {
      $project: // Tells mongo to send selected members only
      {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ]) // return a document/ array of objects
  if(!channel?.length){
    throw new ApiError(400, "channel does not exist")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched succesfully")
    )
})

// new-recipe-list
const newRecipeList = asyncHandler( async(req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "recipes",
        localField: "watchHistory",
        foreignField: "_id",
        as: "WatchHistory",
        pipeline:[
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{
                $project: { fullName: 1, username: 1, avatar: 1 }
              }]
            }
          },
          {
            $addFields: {
              owner: {
                $first : "$owner"
              }
            }
          }
        ]
      }
    }
  ])
  if(!user){
    throw new ApiError(400, "User Watch history not found")
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200, user[0].watchHistory, "User WatchedHistory fetched succesfuly"
      )
    )
})

export {
  newRecipe,
  getRecipe,
  getAllRecipes,
  updateRecipe,
  newRecipeList
}