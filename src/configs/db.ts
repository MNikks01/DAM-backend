import mongoose from "mongoose";
import dotenv from "dotenv";
import { MONGODB_URI } from "./configs";
dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected at : ", connection.connection.host);
  } catch (error) {
    console.log("mongodb connection failed :", error);
    process.exit(1);
  }
};

export default connectDB;
