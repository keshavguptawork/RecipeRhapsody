import { asyncHandler } from "../utils/asyncHandler.utils.js";
import {ApiError} from "../utils/ApiError.utils.js"
import {User} from "../models/user.model.js" 
import {uploadOnCloudinary} from "../utils/cloudinaryUpload.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId)
    const userAccessToken = user.generateAccessToken()
    const userRefreshToken = user.generateRefreshToken()

    user.refreshToken = userRefreshToken   // save refreshToken to db
    await user.save({validateBeforeSave: false}) // save user in db BUT no update existing

    return {userAccessToken, userAccessToken}

  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating token")
  }
}

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
    throw new ApiError(500, "Something went wrong while uploading avatar")
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
  
  // check for user and response & remove password, refresh token
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

const loginUser = asyncHandler( async(req, res) => {
  // extract data from req body
  const { username, email, password } = req.body

  // find if it is username or email
  if(!(username || email)){
    throw new ApiError(400, "username or email is required")
  }

  // find the user in db, throw error if not
  const userFound = await User.findOne({
    $or: [{username}, {email}]
  })
  if(!userFound){
    throw new ApiError(400, "User does not exist!")
  }
  
  // password check
  const isPassValid = await userFound.isPasswordCorrect(password)
  if(!isPassValid){
    throw new ApiError(401, "Invalid user credential")
  }

  // generate access and refresh token
  const {userAccessToken, userRefreshToken} = await generateAccessAndRefreshToken(userFound._id)

  // send these tokens as cookies
  const loggedInUser = await User.findById(userFound._id).select("-password -refreshToken") // retrieve same user which has new data (tokens)
  const cookieFlags = { httpOnly: true, secure: true } // make cookies editable by server ONLY
  return res
    .status(200)
    .cookie("accessToken", userAccessToken, cookieFlags)
    .cookie("refreshToken", userRefreshToken, cookieFlags)
    .json(
      new ApiResponse(
        200, {
          user: loggedInUser,
          userAccessToken, 
          userRefreshToken,
        },
        "user loggedIn successfully"
      )
    )

}) 

const logoutUser = asyncHandler(async (req, res) => {
  // when above request is fired verifyJWT MW auto gets fired and gives reference
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
  const cookieFlags = { httpOnly: true, secure: true }
  return res
    .status(200)
    .clearCookie("accessToken", cookieFlags)
    .clearCookie("refreshToken", cookieFlags)
    .json( new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) =>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token expired or used")
    }
  
    const cookieFlags = { httpOnly: true, secure: true }
    const {userAccessToken, userRefreshToken} = await generateAccessAndRefreshToken(user._id)
  
    return res
      .status(200)
      .cookie("accessToken", userAccessToken, cookieFlags)
      .cookie("refreshToken", userRefreshToken, cookieFlags)
      .json(
        new ApiResponse(
          200,
          {userAccessToken, userRefreshToken},
          "accessToken refreshed "
        )
      )
  } catch (error) {
      throw new ApiError(400, err?.message || "invalied refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = reqBody
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = user.isPassValid(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password!")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed succesfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")

})

const updateAccountDetails = asyncHandler(async(req, res) => {
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

const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(500, "Error while uploading the avatar")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: avatar.url },
    {new: true}
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200, user, "avatar changed successfully"
      )
    )

})

const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "CoverImage file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(500, "Error while uploading the cover image")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: coverImage.url },
    {new: true}
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200, user, "coverImage changed successfully"
      )
    )

})

const getUserChannelProfile = asyncHandler( async(req, res) => {
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

export {
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
}