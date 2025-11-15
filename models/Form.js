import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  contact: String,
  gender: String,
  hobbies: [String], 
  subject: String,
  about: String,
  password: String,
  resume: String,
}, { timestamps: true });

export default mongoose.model("FormData", formSchema);
