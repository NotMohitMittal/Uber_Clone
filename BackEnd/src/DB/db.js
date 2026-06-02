const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("Database connected");
  } catch (error) {
    console.log("Database connection failure");
    process.exit(1); // fail-safe
  }
};

module.exports = connectDB;
