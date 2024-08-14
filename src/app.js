import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN, 
  Credential: true
}))

app.use(express.json({limit: "16kb"})) // limiting json input to only 16kb
app.use(express.urlencoded({extended: true, limit: "16kb"})) // to receive url and encode them
app.use(express.static("public")) // declaring a public asset for storing files, images which will be available to all, like favicon, images
app.use(cookieParser())

export { app }
