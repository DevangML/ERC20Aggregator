const mongoose = require("mongoose");
import { config } from "dotenv";
config();

const connectToDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to mongodb`);
  } catch (err) {
    throw err;
  }
};

export default connectToDB;
