import { asyncHandler } from "../utils/asyncHandler.utils.js";
import {ApiError} from "../utils/ApiError.utils.js"
import {User} from "../models/user.model.js" 
import {uploadOnCloudinary} from "../utils/cloudinaryUpload.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js";

const registerUser = asyncHandler( async(req, res) => {
  // get user details from front end  
  const {fullName, email, username, password} = req.body 

  // validation like , not empty
  if(fullName.trim() === "" || email.trim() === "" || username.trim() === "" || password.trim() === ""){
    throw new ApiError(400, "All fields are required")
  }

  // check if user already exits based on username/email
  const existingUser = await User.findOne({ // using User mongoose model to find an object whcih has following username or email
    $or: [{ username }, { email }]
  })
  if(existingUser){
    throw new ApiError(409, "User already exists")
  }

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path       // chaining to see whether resources are available?
  

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required!")
  }
  let coverImageLocalPath; // const coverImageLocalPath = req.files?.coverImage[0]?.path
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  // upload them to cloudinary, validate avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){ 
    throw new ApiError(400, "Avatar file is required!")
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url, // only store cloudinary url of avatar in db
    coverImage: coverImage?.url || "", // store "" if coverImage is not available
    email,
    username: username.toLowerCase() ,
    password
  })
  
  // check for user response & remove password, refresh token
  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if(!newUser){
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  // return response
  return res.status(201).json(
    new ApiResponse(200, newUser, "User successfully registered!")
  )
  
})

export {registerUser}