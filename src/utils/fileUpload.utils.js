import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // built-in node library to read, write, update, delete files

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    // upload the file on cloudianry
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto"})
    // file uploaded succesfully
    console.log("file uploaded", response.url); // get url of uploaded for verification
    return response

  } catch (error) {
      fs.unlinkSync(localFilePath) // remove the loaclly saved temp file as the upload operation failed
  }
}

export {uploadOnCloudinary}