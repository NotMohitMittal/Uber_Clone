const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        required: true,
        minlength: [3, "first-name should have at least 3 characters are required"],
      },
      lastName: {
        type: String,
        required: true,
        minlength: [3, "last-name should have at least 3 characters are required"],
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"],
      trim: true,
      lowercase: true,
      index: true, // don't know why
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [6, "Password must be at least 6 characters"],
      match: [
        // very strict
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&]).{6,}$/,
        "Password must include uppercase, lowercase, number and special character",
      ],
    },
    role : {
      type : String,
      enum : ["user", "captain"],
      default : "user",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
  return;
});

userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};


userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
