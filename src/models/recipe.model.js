import mongoose, { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const recipeSchema = new Schema({
  recipeContent: {
    type: String, 
    required: true
  },
  thumbnail: {
    type: String, // cloudinary url
    required: true
  },
  pictures: {
    type: String, // cloudinary url
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }

}, {timestamps: true})

recipeSchema.plugin(mongooseAggregatePaginate) // will be used to write complex queries

export const Recipe = model("Recipe", recipeSchema)