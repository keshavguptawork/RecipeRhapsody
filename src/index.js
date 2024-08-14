// require('dotenv').config({path: './env'})          // standard practice
import dotenv from "dotenv"                           // experimentsl feature
import connectDB from "./db/index.js";

dotenv.config({path: './env'})

connectDB() // returns a promise as we have written a async function
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`>>> Server is running at: ${process.env.PORT}`);
  })
})
.then(() => {
  app.on("error", (error) => {
    console.log("Express error: ", error);
    throw error
  })
})
.catch((err) => {
  console.log(">>> MongoDB error connection FAILED !! ", err);
})

/* **************** better approach used ****************
import express from "express"
const app = express()

;(async() => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
    app.on("error", (error) => {
      console.log("Express error: ", error);
      throw error
    })

    app.listen(process.env.PORT, ()=>{
      console.log(`App is listening on PORT ${process.env.PORT}`);
    })

  } catch (error) {
    console.log("DB conn Error: ", error);
    throw err    
  }
})()
*/